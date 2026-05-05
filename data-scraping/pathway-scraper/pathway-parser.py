import json
import re
import sys
from pathlib import Path

import pdfplumber

PDFS_DIR = Path(__file__).parent / "pdfs"
OUT_DIR = Path(__file__).parent / "pathways-data"
INDEX_FILE = OUT_DIR / "index.json"

TABLE_HEADER = ("Course or Activity", "Prerequisites", "Credits")

YEAR_TERM_RE = re.compile(r"^\s*Year\s+(\d+)\s+Term\s+(\d+)\s*$")
COURSE_CODE_RE = re.compile(r"\b([A-Z]{4}\d{4})\b")
PROGRAM_LINE_RE = re.compile(r"Program:\s*(.+?)\s*\[(\d{4})\]")
START_TERM_RE = re.compile(r"\bT([1-3])\s+(\d{4})\s+Start\b")
SPEC_CODE_RE = re.compile(r"\b([A-Z]{4,7}\d{0,2}H?)\b")


def normalise_cell(cell):
    if cell is None:
        return ""
    return re.sub(r"\s+", " ", str(cell)).strip()


def is_course_table(rows):
    if not rows or not rows[0]:
        return False
    head = tuple(normalise_cell(c) for c in rows[0][:3])
    return head == TABLE_HEADER


def parse_uoc(cell):
    text = normalise_cell(cell)
    if not text:
        return None
    m = re.search(r"\d+", text)
    return int(m.group(0)) if m else None


def parse_prerequisites(cell):
    return normalise_cell(cell)


def classify_row(row):
    """Return dict for a course row, or None if the row should be ignored."""
    cells = [normalise_cell(c) for c in row]
    while len(cells) < 3:
        cells.append("")
    activity, prereqs, credits = cells[0], cells[1], cells[2]
    if not activity:
        return None

    codes = COURSE_CODE_RE.findall(activity)
    uoc = parse_uoc(credits)

    if not codes:
        return {
            "kind": "elective",
            "uoc": uoc,
            "prerequisites_raw": parse_prerequisites(prereqs),
            "courses": [],
            "placeholder": activity,
        }

    if len(codes) == 1:
        code = codes[0]
        title = activity.replace(code, "", 1).strip()
        return {
            "kind": "course",
            "uoc": uoc,
            "prerequisites_raw": parse_prerequisites(prereqs),
            "courses": [{"code": code, "title": title}],
            "placeholder": None,
        }

    is_choice = bool(re.search(r"\bor\b", activity, flags=re.IGNORECASE))
    courses = []
    remainder = activity
    for code in codes:
        idx = remainder.find(code)
        if idx == -1:
            courses.append({"code": code, "title": ""})
            continue
        before = remainder[:idx].strip(" ,/")
        after = remainder[idx + len(code):]
        next_idx = COURSE_CODE_RE.search(after)
        title_chunk = after[: next_idx.start()] if next_idx else after
        title = re.sub(r"\bor\b", "", title_chunk, flags=re.IGNORECASE).strip(" ,-/")
        courses.append({"code": code, "title": title})
        remainder = after[next_idx.start():] if next_idx else ""
        _ = before

    return {
        "kind": "choice" if is_choice else "course",
        "uoc": uoc,
        "prerequisites_raw": parse_prerequisites(prereqs),
        "courses": courses,
        "placeholder": None,
    }


def line_groups(words):
    """Group pdfplumber word dicts into (top_y, text) lines."""
    if not words:
        return []
    sorted_words = sorted(words, key=lambda w: (round(w["top"], 1), w["x0"]))
    lines = []
    current_top = None
    current = []
    for w in sorted_words:
        top = round(w["top"], 1)
        if current_top is None or abs(top - current_top) <= 2:
            current.append(w)
            current_top = top if current_top is None else current_top
        else:
            lines.append((current_top, " ".join(x["text"] for x in current)))
            current = [w]
            current_top = top
    if current:
        lines.append((current_top, " ".join(x["text"] for x in current)))
    return lines


def iter_sections(pdf):
    """
    Walk the PDF in document order, returning a list of
    {"year": int, "term": int, "rows": [...]} sections.
    Tables on a page that come before any heading on that page
    extend the most recent section (handles tables spanning page breaks).
    """
    sections = []
    notes = []

    for page in pdf.pages:
        words = page.extract_words(use_text_flow=True)
        lines = line_groups(words)

        events = []
        for top, text in lines:
            m = YEAR_TERM_RE.match(text)
            if m:
                events.append((top, "heading", int(m.group(1)), int(m.group(2))))

        for tbl in page.find_tables():
            extracted = tbl.extract()
            if not is_course_table(extracted):
                continue
            top = tbl.bbox[1]
            events.append((top, "table", extracted))

        events.sort(key=lambda e: e[0])

        for event in events:
            kind = event[1]
            if kind == "heading":
                _, _, year, term = event
                sections.append({"year": year, "term": term, "rows": []})
            else:
                _, _, extracted = event
                rows = extracted[1:]  # drop header row
                if sections:
                    sections[-1]["rows"].extend(rows)
                else:
                    notes.append("Orphan table before any Year/Term heading")

    return sections, notes


def parse_metadata(pdf, source_name):
    """Pull program/spec/term metadata from the first page text."""
    page0 = pdf.pages[0]
    text = page0.extract_text() or ""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]

    program_code = None
    program_name = None
    specialisation_code = None
    specialisation_name = None
    start_term = None

    for ln in lines:
        m = PROGRAM_LINE_RE.search(ln)
        if m:
            program_name = m.group(1).strip()
            program_code = m.group(2)
            break

    header_blob = " ".join(lines[:4])
    m = START_TERM_RE.search(header_blob)
    if m:
        start_term = f"T{m.group(1)} {m.group(2)}"

    if not program_code:
        m = re.search(r"\b(\d{4})\b", header_blob)
        if m:
            program_code = m.group(1)

    parts = [p.strip() for p in header_blob.split(" - ")]
    if start_term and len(parts) >= 2:
        candidates = [p for p in parts if p and p != f"{start_term} Start"]
        for p in reversed(candidates):
            if SPEC_CODE_RE.fullmatch(p) and not p.isdigit():
                specialisation_code = p
                idx = candidates.index(p)
                if idx > 0:
                    specialisation_name = candidates[idx - 1]
                break

    if not specialisation_name and program_name:
        for p in parts:
            if p and p != program_name and not p.isdigit() and p != f"{start_term} Start" and p != specialisation_code:
                if not re.match(r"^\d+", p) and "Bachelor" not in p and "Master" not in p and "Program:" not in p:
                    specialisation_name = p
                    break

    return {
        "program_code": program_code,
        "program_name": program_name,
        "specialisation_code": specialisation_code,
        "specialisation_name": specialisation_name,
        "start_term": start_term,
        "source_pdf": source_name,
    }


def build_pathway(pdf_path):
    with pdfplumber.open(pdf_path) as pdf:
        meta = parse_metadata(pdf, pdf_path.name)
        sections, notes = iter_sections(pdf)

    years_map = {}
    for sec in sections:
        y = sec["year"]
        years_map.setdefault(y, {})
        courses = []
        for row in sec["rows"]:
            classified = classify_row(row)
            if classified is None:
                continue
            courses.append(classified)
        years_map[y][sec["term"]] = courses

    years = []
    for y in sorted(years_map):
        terms = []
        for t in sorted(years_map[y]):
            terms.append({"term": t, "courses": years_map[y][t]})
        years.append({"year": y, "terms": terms})

    return {
        **meta,
        "years": years,
        "notes": notes,
    }


def write_pathway(out_dir, pdf_stem, data):
    out_path = out_dir / f"{pdf_stem}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)
    return out_path


def build_index(all_pathways):
    index = []
    for stem, data in all_pathways:
        index.append({
            "file": f"{stem}.json",
            "program_code": data.get("program_code"),
            "program_name": data.get("program_name"),
            "specialisation_code": data.get("specialisation_code"),
            "specialisation_name": data.get("specialisation_name"),
            "start_term": data.get("start_term"),
        })
    index.sort(key=lambda x: (x.get("program_code") or "", x.get("specialisation_code") or "", x.get("start_term") or "", x["file"]))
    return index


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pdf_paths = sorted(PDFS_DIR.glob("*.pdf"))
    n_total = len(pdf_paths)
    print(f"Found {n_total} PDFs in {PDFS_DIR}")

    n_ok = n_fail = 0
    all_pathways = []
    for i, path in enumerate(pdf_paths, start=1):
        stem = path.stem
        try:
            data = build_pathway(path)
            write_pathway(OUT_DIR, stem, data)
            all_pathways.append((stem, data))
            n_ok += 1
            print(f"[{i}/{n_total}] OK {path.name}")
        except Exception as e:
            n_fail += 1
            print(f"[{i}/{n_total}] FAILED {path.name}: {e}", file=sys.stderr)

    index = build_index(all_pathways)
    with INDEX_FILE.open("w", encoding="utf-8") as f:
        json.dump(index, f, indent=2, sort_keys=True, ensure_ascii=False)

    print(f"Done. parsed={n_ok} failed={n_fail} index={INDEX_FILE.name}")


if __name__ == "__main__":
    main()
