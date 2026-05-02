import json
import os
import re
import sys
import time

import httpx
from bs4 import BeautifulSoup

YEAR = 2026
BASE_URL = f"https://timetable.unsw.edu.au/{YEAR}"
INDEX_URL = f"{BASE_URL}/subjectSearch.html"
USER_AGENT = "Pathway-UNSW-Catalogue-Scraper/0.1 (student project)"
REQUEST_DELAY = 1
HEADERS = {"User-Agent": USER_AGENT}

SECTIONS = [
    ("UGRD", "undergraduate"),
    ("PGRD", "postgraduate"),
    ("RSCH", "research"),
]
SECTION_IDS = {sid for sid, _ in SECTIONS}

KENS_HREF_RE = re.compile(r'href="([A-Z]{2,8})KENS\.html"')


def fetch(client, url):
    """GET url. Returns Response on 200, None on 404. Sleeps after every request."""
    try:
        resp = client.get(url, headers=HEADERS)
    finally:
        time.sleep(REQUEST_DELAY)
    if resp.status_code == 404:
        return None
    resp.raise_for_status()
    return resp


def get_kens_subject_codes(html):
    return sorted(set(KENS_HREF_RE.findall(html)))


def make_entry(code, title, uoc, level):
    return {
        "code": code,
        "title": title,
        "uoc": int(uoc),
        "level": level,
        "terms": [],
        "prerequisites_raw": None,
        "exclusions_raw": None,
    }


def _is_course_row(tag):
    if tag.name != "tr":
        return False
    classes = tag.get("class") or []
    return "rowLowlight" in classes or "rowHighlight" in classes


def _is_section_anchor(tag):
    return (
        tag.name == "a"
        and tag.get("name") in SECTION_IDS
    )


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

            results[section_id][code] = make_entry(code, title, uoc, level)

    return results["UGRD"], results["PGRD"], results["RSCH"]


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    ugrd_all = {}
    pgrd_all = {}
    rsch_all = {}

    with httpx.Client(timeout=30.0) as client:
        print(f"Fetching subject index: {INDEX_URL}")
        index_resp = fetch(client, INDEX_URL)
        if index_resp is None:
            print("Subject index returned 404, aborting", file=sys.stderr)
            sys.exit(1)

        codes = get_kens_subject_codes(index_resp.text)
        n = len(codes)
        print(f"Found {n} Kensington subject areas\n")

        for i, code in enumerate(codes, 1):
            url = f"{BASE_URL}/{code}KENS.html"
            try:
                resp = fetch(client, url)
                if resp is None:
                    print(f"[{i}/{n}] {code} 404, skipping", file=sys.stderr)
                    continue

                ugrd, pgrd, rsch = parse_subject_page(resp.text, code)
                ugrd_all.update(ugrd)
                pgrd_all.update(pgrd)
                rsch_all.update(rsch)

                print(
                    f"[{i}/{n}] Scraping {code}... "
                    f"found {len(ugrd)} UG, {len(pgrd)} PG, {len(rsch)} RSCH"
                )
            except Exception as e:
                print(f"[{i}/{n}] {code} FAILED: {e}", file=sys.stderr)
                continue

    print()
    print(f"Summary: {len(ugrd_all)} undergraduate, "
          f"{len(pgrd_all)} postgraduate, "
          f"{len(rsch_all)} research")

    for filename, data in [
        ("undergraduate.json", ugrd_all),
        ("postgraduate.json", pgrd_all),
        ("research.json", rsch_all),
    ]:
        path = os.path.join(script_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, sort_keys=True, ensure_ascii=False)
        print(f"Wrote {len(data)} entries to {path}")


if __name__ == "__main__":
    main()
