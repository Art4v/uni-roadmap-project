import re
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

INDEX_URL = "https://www.unsw.edu.au/engineering/student-life/student-resources/progression-checksheets"
USER_AGENT = "Pathway-UNSW-Scraper/0.1 (student project)"
REQUEST_DELAY = 1
PDFS_DIR = Path(__file__).parent / "pdfs"

HEADERS = {"User-Agent": USER_AGENT}

UNSAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")


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


def collect_pdf_urls(html, base_url):
    soup = BeautifulSoup(html, "html.parser")
    seen = set()
    urls = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if not href:
            continue
        absolute = urljoin(base_url, href)
        path = urlparse(absolute).path.lower()
        if not path.endswith(".pdf"):
            continue
        if absolute in seen:
            continue
        seen.add(absolute)
        urls.append(absolute)
    return urls


def filename_for(url):
    parts = [p for p in urlparse(url).path.split("/") if p]
    tail = parts[-2:] if len(parts) >= 2 else parts
    raw = "_".join(unquote(p) for p in tail)
    return UNSAFE_FILENAME_RE.sub("_", raw)


def main():
    PDFS_DIR.mkdir(parents=True, exist_ok=True)

    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        print(f"Fetching index: {INDEX_URL}")
        index_resp = fetch(client, INDEX_URL)
        if index_resp is None:
            print("Index page returned 404, aborting.", file=sys.stderr)
            return

        pdf_urls = collect_pdf_urls(index_resp.text, INDEX_URL)
        n_total = len(pdf_urls)
        print(f"Found {n_total} PDF links")

        n_ok = n_skip = n_fail = 0
        for i, url in enumerate(pdf_urls, start=1):
            name = filename_for(url)
            target = PDFS_DIR / name

            if target.exists():
                print(f"[{i}/{n_total}] SKIP {name}")
                n_skip += 1
                continue

            try:
                resp = fetch(client, url)
                if resp is None:
                    print(f"[{i}/{n_total}] FAILED {url} 404", file=sys.stderr)
                    n_fail += 1
                    continue
                target.write_bytes(resp.content)
                print(f"[{i}/{n_total}] OK {name}")
                n_ok += 1
            except Exception as e:
                print(f"[{i}/{n_total}] FAILED {url} {e}", file=sys.stderr)
                n_fail += 1

        print(f"Done. downloaded={n_ok} skipped={n_skip} failed={n_fail}")


if __name__ == "__main__":
    main()
