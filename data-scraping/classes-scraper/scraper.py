import json
import re
import sys
import time
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

YEAR = 2026
USER_AGENT = "Pathway-UNSW-Scraper/0.1 (student project)"
REQUEST_DELAY = 1
TIMETABLE_BASE = f"https://timetable.unsw.edu.au/{YEAR}"
HANDBOOK_BASE = "https://www.handbook.unsw.edu.au"
SUBJECT_INDEX_URL = f"{TIMETABLE_BASE}/subjectSearch.html"

HEADERS = {"User-Agent": USER_AGENT}

SECTIONS = [
    ("UGRD", "undergraduate"),
    ("PGRD", "postgraduate"),
    ("RSCH", "research"),
]
SECTION_IDS = {sid for sid, _ in SECTIONS}

KENS_HREF_RE = re.compile(r'href="([A-Z]{2,8})KENS\.html"')


def fetch(client, url):
    """GET url. Returns Response on 200, None on 404. Always sleeps after."""
    try:
        resp = client.get(url, headers=HEADERS)
    finally:
        time.sleep(REQUEST_DELAY)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp


def make_stub(code, title, uoc, level):
    return {
        "code": code,
        "title": title,
        "uoc": int(uoc),
        "level": level,
        "terms": [],
        "campus": None,
        "faculty": None,
        "school": None,
        "description": None,
        "prerequisites_raw": None,
        "enrolment_rules_raw": [],
        "exclusions": [],
        "equivalents": [],
    }


def _is_course_row(tag):
    if tag.name != "tr":
        return False
    classes = tag.get("class") or []
    return "rowLowlight" in classes or "rowHighlight" in classes


def _is_section_anchor(tag):
    return tag.name == "a" and tag.get("name") in SECTION_IDS


def parse_subject_page(html, subject_code):
    soup = BeautifulSoup(html, "html.parser")
    results = {sid: {} for sid, _ in SECTIONS}

    for section_id, level in SECTIONS:
        anchor = soup.find("a", attrs={"name": section_id})
        if anchor is None:
            continue

        for node in anchor.find_all_next():
            if _is_section_anchor(node) and node.get("name") != section_id:
                break
            if not _is_course_row(node):
                continue

            cells = node.find_all("td", class_="data", recursive=False)
            if len(cells) != 3:
                continue

            code_link = cells[0].find("a")
            title_link = cells[1].find("a")
            if code_link is None or title_link is None:
                continue

            code = code_link.get_text(strip=True)
            title = title_link.get_text(strip=True)
            uoc_text = cells[2].get_text(strip=True)

            try:
                uoc = int(uoc_text)
            except ValueError:
                print(
                    f"  ! {subject_code} {code}: bad UOC {uoc_text!r}, skipping row",
                    file=sys.stderr,
                )
                continue

            results[section_id][code] = make_stub(code, title, uoc, level)

    return results["UGRD"], results["PGRD"], results["RSCH"]


def handbook_url(code, level):
    return f"{HANDBOOK_BASE}/{level}/courses/{YEAR}/{code}"


def _assoc_list(lst):
    return [
        {"code": x.get("assoc_code"), "title": x.get("assoc_title")}
        for x in (lst or [])
    ]


def _parse_terms(offering_detail):
    if not offering_detail:
        return []
    raw = offering_detail.get("offering_terms")
    if not raw:
        return []
    return [t.strip() for t in raw.split(",") if t.strip()]


def enrich_from_handbook(html, entry):
    """Mutate entry in place with handbook fields. Raises on parse errors."""
    soup = BeautifulSoup(html, "html.parser")
    tag = soup.find("script", id="__NEXT_DATA__")
    if tag is None or not tag.string:
        raise ValueError("__NEXT_DATA__ script tag not found")

    data = json.loads(tag.string)
    page_content = (
        data.get("props", {}).get("pageProps", {}).get("pageContent")
    )
    if not page_content:
        raise ValueError("pageContent missing in __NEXT_DATA__")

    credit_points = page_content.get("credit_points")
    if credit_points not in (None, ""):
        try:
            entry["uoc"] = int(credit_points)
        except (TypeError, ValueError):
            pass

    entry["terms"] = _parse_terms(page_content.get("offering_detail"))

    admin_location = page_content.get("admin_location") or {}
    entry["campus"] = admin_location.get("value") or None

    faculty_detail = page_content.get("faculty_detail") or []
    entry["faculty"] = faculty_detail[0].get("name") if faculty_detail else None

    school_detail = page_content.get("school_detail") or []
    entry["school"] = school_detail[0].get("name") if school_detail else None

    entry["description"] = page_content.get("description")
    entry["prerequisites_raw"] = page_content.get("pre_requisites")

    rules = page_content.get("enrolment_rules") or []
    entry["enrolment_rules_raw"] = [
        r.get("description") for r in rules if r.get("description")
    ]

    entry["exclusions"] = _assoc_list(page_content.get("exclusion"))
    entry["equivalents"] = _assoc_list(page_content.get("eqivalents"))


def write_output(out_dir, filename, data):
    path = out_dir / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)
    print(f"Wrote {len(data)} entries to {path}")


def main():
    out_dir = Path(__file__).resolve().parent / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    ugrd_all = {}
    pgrd_all = {}
    rsch_all = {}

    with httpx.Client(timeout=30.0) as client:
        # Phase 1: timetable
        print(f"Phase 1: fetching subject index {SUBJECT_INDEX_URL}")
        index_resp = fetch(client, SUBJECT_INDEX_URL)
        if index_resp is None:
            print("Subject index returned 404, aborting", file=sys.stderr)
            sys.exit(1)

        subject_codes = sorted(set(KENS_HREF_RE.findall(index_resp.text)))
        n_subj = len(subject_codes)
        print(f"Found {n_subj} Kensington subject areas\n")

        for i, subj in enumerate(subject_codes, 1):
            url = f"{TIMETABLE_BASE}/{subj}KENS.html"
            try:
                resp = fetch(client, url)
            except Exception as e:
                print(f"[{i}/{n_subj}] Subject {subj}: FAILED {e}", file=sys.stderr)
                continue

            if resp is None:
                print(f"[{i}/{n_subj}] Subject {subj}: 404, skipping", file=sys.stderr)
                continue

            try:
                ugrd, pgrd, rsch = parse_subject_page(resp.text, subj)
            except Exception as e:
                print(f"[{i}/{n_subj}] Subject {subj}: parse FAILED {e}", file=sys.stderr)
                continue

            ugrd_all.update(ugrd)
            pgrd_all.update(pgrd)
            rsch_all.update(rsch)

            print(
                f"[{i}/{n_subj}] Subject {subj}: "
                f"{len(ugrd)} UG, {len(pgrd)} PG, {len(rsch)} RSCH"
            )

        print()
        print(
            f"Phase 1 summary: {len(ugrd_all)} UG, "
            f"{len(pgrd_all)} PG, {len(rsch_all)} RSCH course codes\n"
        )

        # Phase 2: handbook
        work = (
            [(c, "undergraduate", e) for c, e in ugrd_all.items()]
            + [(c, "postgraduate", e) for c, e in pgrd_all.items()]
            + [(c, "research", e) for c, e in rsch_all.items()]
        )
        n_total = len(work)
        print(f"Phase 2: enriching {n_total} courses from handbook\n")

        success_per_level = {"undergraduate": 0, "postgraduate": 0, "research": 0}
        failure_per_level = {"undergraduate": 0, "postgraduate": 0, "research": 0}

        for i, (code, level, entry) in enumerate(work, 1):
            url = handbook_url(code, level)
            print(f"[{i}/{n_total}] Enriching {code}...")
            try:
                resp = fetch(client, url)
                if resp is None:
                    raise ValueError("handbook page returned 404")
                enrich_from_handbook(resp.text, entry)
                success_per_level[level] += 1
            except Exception as e:
                failure_per_level[level] += 1
                print(f"FAILED {code} ({level}): {e}", file=sys.stderr)
                continue

        print()
        print("Phase 2 summary:")
        for lvl in ("undergraduate", "postgraduate", "research"):
            total_lvl = success_per_level[lvl] + failure_per_level[lvl]
            print(
                f"  {lvl}: {success_per_level[lvl]}/{total_lvl} enriched, "
                f"{failure_per_level[lvl]} failed"
            )
        print()

    write_output(out_dir, "undergraduate.json", ugrd_all)
    write_output(out_dir, "postgraduate.json", pgrd_all)
    write_output(out_dir, "research.json", rsch_all)


if __name__ == "__main__":
    main()
