# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Keeping Docs Up to Date

After every major change (new scraper, new phase started or completed, repo restructure, new tech added), update both `README.md` and `CLAUDE.md` to reflect the current state. README.md is the human-facing project overview; CLAUDE.md is the working-context guide for Claude. Both should stay accurate.

## Project Overview

UNSW course roadmap and degree pathway planner. End goal: a web app that lets students browse all UNSW courses, visualise prerequisite chains, and build multi-year degree plans.

**Current phase status:**
- Phase 0 (Learning) ✅
- Phase 1 (Timetable scraper) ✅
- Phase 2 (Course enrichment scraper) ✅
- Phase 3 (Pathway PDF scraper + parser) ✅
- Phase 4 (Frontend MVP) 🚧 in progress
- Phase 5 (Backend + DB) 🔲 planned
- Phase 6 (Deployment) 🔲 planned

## Repository Layout

```
uni-roadmap-project/
├── data-scraping/
│   ├── learning/          # Phase 0 — practice scraper
│   ├── test-1/            # Phase 1 — timetable-only scraper (superseded)
│   ├── classes-scraper/   # Phase 2 — current working course scraper
│   ├── classes-data/      # Phase 2 — committed snapshot of scraped courses
│   └── pathway-scraper/   # Phase 3 — pathway PDF scraper + parser
│       ├── pathway-scraper.py
│       ├── pathway-parser.py
│       ├── pdfs/           # ~612 downloaded checksheet PDFs
│       └── pathways-data/  # ~613 structured JSON files + index.json
├── mvp-v1/                # Phase 4 — versioned MVP snapshot
│   └── frontend/          # React + Vite + Tailwind MVP
│       └── src/           # App.jsx, components.jsx, data.js, icons.jsx
├── backend/               # Phase 5 — planned, not yet created
├── CLAUDE.md
└── README.md
```

## Running the Scrapers

```bash
pip install httpx beautifulsoup4 pdfplumber

# Phase 2 — course scraper
cd data-scraping/classes-scraper && python scraper.py

# Phase 3 — pathway scraper (two steps)
cd data-scraping/pathway-scraper
python pathway-scraper.py   # downloads PDFs to pdfs/
python pathway-parser.py    # parses PDFs into pathways-data/
```

A full course scraper run hits thousands of pages with a 1-second delay — expect a long time. Output goes to `data-scraping/classes-scraper/data/`; `classes-data/` holds a committed snapshot.

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

## Architecture: pathway-scraper

Two separate scripts:

**`pathway-scraper.py`** — Downloads PDFs from the UNSW Engineering progression checksheet index (`https://www.unsw.edu.au/engineering/student-life/student-resources/progression-checksheets`). Finds all PDF links and saves them to `pdfs/` with sanitised filenames. Same `fetch()` + sleep pattern as classes-scraper.

**`pathway-parser.py`** — Uses `pdfplumber` to parse each PDF. Identifies tables with header `(Course or Activity, Prerequisites, Credits)`, extracts year/term markers, and builds a structured list of courses per checksheet. Also extracts program name, program code, specialisation code, and start term from page text. Writes one JSON file per PDF to `pathways-data/` and an `index.json` summary.

Currently limited to UNSW Engineering — the only faculty publishing checksheets as PDFs at the scraped URL.

## Architecture: frontend

React 18 + Vite + Tailwind CSS MVP. Located in `mvp-v1/frontend/`.

- `src/data.js` — pre-processed course and pathway data used by the app
- `src/App.jsx` — main app component
- `src/components.jsx` — shared UI components
- `src/icons.jsx` — SVG icon components

Run with `npm run dev` from the `mvp-v1/frontend/` directory.

## Conventions in the Scrapers

- `YEAR` is a module-level constant. Change it to scrape a different year.
- `fetch()` returns `None` on 404 (callers must handle this) and raises on other non-2xx. It always sleeps `REQUEST_DELAY` in a `finally` block — keep this behaviour when extending; politeness is intentional.
- `USER_AGENT` identifies the scraper as a student project. Keep something similar if you add new scrapers.
- Exceptions during a single subject/course are caught and logged to stderr so one bad page doesn't kill the whole run. Preserve this pattern.
- JSON is written sorted (`sort_keys=True`) with `indent=2` and `ensure_ascii=False`.
- Only Kensington (`KENS`) is scraped for courses. Adding other campuses is out of scope unless explicitly requested.
