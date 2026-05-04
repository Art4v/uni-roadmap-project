# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UNSW course roadmap and degree pathway planner. End goal: a web app that lets students browse all UNSW courses, visualise prerequisite chains, and build multi-year degree plans. Currently in the data-scraping phase; backend and frontend are planned (see `README.md` for the full phase plan).

## Repository Layout

The repo is being restructured. The README still references `test-2/` but the working scraper has moved to `classes-scraper/`, with output split into a sibling `classes-data/`.

- `data-scraping/learning/` — first practice scraper (quotes.toscrape.com).
- `data-scraping/test-1/` — earliest timetable-only scraper. Superseded.
- `data-scraping/classes-scraper/scraper.py` — **current working scraper.** Two-phase: timetable + handbook enrichment.
- `data-scraping/classes-data/` — JSON output (`undergraduate.json`, `postgraduate.json`, `research.json`).
- `data-scraping/pathway-scraper/` — new in-progress scraper for degree pathways/programs (currently a stub).
- `backend/`, `frontend/` — planned, not yet created.

If you see references to `test-2/` in the README, prefer `classes-scraper/` — the README hasn't been updated.

## Running the Scraper

```bash
pip install httpx beautifulsoup4
cd data-scraping/classes-scraper
python scraper.py
```

A full run hits thousands of pages with a 1-second delay each — expect it to take a long time. Output is written to `data-scraping/classes-scraper/data/` by the script itself; `classes-data/` holds a committed snapshot.

There is no test suite, linter config, or build step. Python 3.13.

## Architecture: classes-scraper

Single-file scraper, two HTTP phases sharing one `httpx.Client`:

**Phase 1 — Timetable (`https://timetable.unsw.edu.au/{YEAR}`)**
1. Fetch `subjectSearch.html` and regex out subject-area codes ending in `KENS` — Kensington campus only by design.
2. For each subject area, fetch `{CODE}KENS.html` and parse the course table.
3. Course rows are `<tr class="rowLowlight|rowHighlight">` grouped under named anchors `UGRD` / `PGRD` / `RSCH`. The parser walks `find_all_next()` from each anchor and stops when it hits the next section anchor.
4. Produces a course stub with `code`, `title`, `uoc`, `level`; everything else is left blank for Phase 2.

**Phase 2 — Handbook (`https://www.handbook.unsw.edu.au/{level}/courses/{YEAR}/{CODE}`)**
1. For every stub, fetch the handbook page.
2. Extract the `<script id="__NEXT_DATA__">` JSON blob — this is the Next.js page payload. All structured fields (terms, faculty, school, campus, description, prerequisites, exclusions, equivalents) live under `props.pageProps.pageContent`. **Do not parse the rendered HTML for these fields — go through `__NEXT_DATA__`.**
3. `enrich_from_handbook()` mutates the stub in place. Phase 1 fills in `uoc` from the timetable; Phase 2 overwrites it from `credit_points` if present.

`prerequisites_raw` and `enrolment_rules_raw` are kept as raw strings from the handbook. Parsing these into a structured prerequisite graph is a future task.

## Conventions in the Scraper

- `YEAR` is a module-level constant. Change it to scrape a different year.
- `fetch()` returns `None` on 404 (callers must handle this) and raises on other non-2xx. It always sleeps `REQUEST_DELAY` in a `finally` block — keep this behaviour when extending; politeness is intentional.
- `USER_AGENT` identifies the scraper as a student project. Keep something similar if you add new scrapers.
- Exceptions during a single subject/course are caught and logged to stderr so one bad page doesn't kill the whole run. Preserve this pattern.
- JSON is written sorted (`sort_keys=True`) with `indent=2` and `ensure_ascii=False`.
- Only Kensington (`KENS`) is scraped. Adding other campuses is out of scope unless explicitly requested.
