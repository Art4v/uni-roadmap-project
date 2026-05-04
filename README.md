# uni-roadmap-project

A full-stack university course roadmap and degree pathway planner for UNSW students. The goal is to let students visually explore all available courses, map out their degree, check prerequisites, and plan term-by-term what they need to complete.

---

## Project Vision

UNSW's existing timetable and handbook tools are functional but fragmented — students have to cross-reference multiple sites to understand what courses are available, when they run, what the prerequisites are, and how they fit into a degree. This project aims to build a single, clean interface that pulls all that data together and helps students plan their entire university journey in one place.

The end product will be a web application where a student can:

- Search and browse every UNSW course across undergraduate, postgraduate, and research levels
- See when each course runs, what campus it's on, and what faculty/school owns it
- Visualise prerequisite chains as a graph so they know what order to take courses in
- Build a personalised multi-year degree plan term by term
- Check for clashes, exclusions, and equivalents automatically

---

## Project Phases

### Phase 0 — Learning Web Scraping ✅
**Location:** `data-scraping/learning/`

Started by learning the fundamentals of web scraping using Python's `requests` library and `BeautifulSoup`. The practice scraper pulled quotes and authors from [quotes.toscrape.com](http://quotes.toscrape.com) and saved them as a JSON file. This established the core pattern used throughout the rest of the project.

**Key learnings:**
- HTML parsing with BeautifulSoup
- Making HTTP requests with `requests`
- Serialising structured data to JSON

---

### Phase 1 — UNSW Timetable Scraper (Test 1) ✅
**Location:** `data-scraping/test-1/`

First real scraper targeting the [UNSW Timetable](https://timetable.unsw.edu.au/2026/subjectSearch.html). It discovers all Kensington subject areas, iterates through each one, and extracts every course listed under undergraduate (UGRD), postgraduate (PGRD), and research (RSCH) sections.

**Output:** Three JSON files — `undergraduate.json`, `postgraduate.json`, `research.json`

**Each course entry contains:**
```json
{
  "code": "COMP2041",
  "title": "Software Construction",
  "uoc": 6,
  "level": "undergraduate",
  "terms": [],
  "prerequisites_raw": null,
  "exclusions_raw": null
}
```

**Limitations of Test 1:**
- No term/offering information
- No prerequisites or enrolment rules
- No faculty, school, campus, or description data
- All extra fields blank — timetable alone doesn't have enough detail

---

### Phase 2 — Timetable + Handbook Enrichment (Test 2) ✅
**Location:** `data-scraping/test-2/`

Major improvement. After scraping course codes from the timetable (Phase 1), this scraper does a second pass through the [UNSW Handbook](https://www.handbook.unsw.edu.au) to enrich every course with the full set of metadata. Handbook data is embedded in a `__NEXT_DATA__` JSON blob in each course's page.

**Output:** `data/undergraduate.json`, `data/postgraduate.json`, `data/research.json`

**Full course schema (post-enrichment):**
```json
{
  "code": "COMP2041",
  "title": "Software Construction",
  "uoc": 6,
  "level": "undergraduate",
  "terms": ["Term 2", "Term 3"],
  "campus": "Sydney",
  "faculty": "Faculty of Engineering",
  "school": "School of Computer Science and Engineering",
  "description": "...",
  "prerequisites_raw": "...",
  "enrolment_rules_raw": ["..."],
  "exclusions": [{ "code": "COMP9041", "title": "..." }],
  "equivalents": [{ "code": "COMP9041", "title": "..." }]
}
```

**How it works (two-phase pipeline):**
1. **Phase 1 (Timetable):** Fetch the subject index → iterate all Kensington subject areas → parse course rows → collect all codes, titles, and UOC values
2. **Phase 2 (Handbook):** For each course code, fetch its Handbook page → parse `__NEXT_DATA__` JSON → extract terms, campus, faculty, school, description, prerequisites, enrolment rules, exclusions, and equivalents

A 1-second delay between requests keeps the scraper polite and avoids rate limiting.

---

### Phase 3 — Database + Backend API 🔲 (Planned)
**Location:** `backend/` *(to be created)*

Load the scraped JSON data into a proper database (likely PostgreSQL) and expose it via a REST or GraphQL API.

**Planned stack:**
- **Database:** PostgreSQL
- **ORM / API:** Python (FastAPI) or Node.js (Express)
- **Endpoints:**
  - `GET /courses` — list/search all courses with filters (level, faculty, term, UOC)
  - `GET /courses/:code` — full detail for a single course
  - `GET /courses/:code/prerequisites` — prerequisite graph for a course
  - `POST /planner` — save/load a student's personal degree plan

---

### Phase 4 — Frontend Web App 🔲 (Planned)
**Location:** `frontend/` *(to be created)*

A React web app that consumes the API and gives students an interactive interface.

**Planned features:**
- Course search and filter by faculty, level, term, UOC
- Prerequisite chain visualisation (node graph, e.g. using D3.js or React Flow)
- Drag-and-drop degree planner — assign courses to terms across multiple years
- Automatic conflict detection (exclusions, term clashes)
- Shareable/exportable degree plan

**Planned stack:**
- React + TypeScript
- Tailwind CSS
- React Flow or D3.js for the prerequisite graph
- Zustand or Redux for planner state

---

### Phase 5 — Deployment 🔲 (Planned)
- Frontend: Vercel or Netlify
- Backend + DB: Railway, Render, or a VPS
- CI/CD: GitHub Actions for automated scraper refresh (run each year when UNSW publishes new timetable data)

---

## Repository Structure

```
uni-roadmap-project/
├── data-scraping/
│   ├── learning/          # Practice scraper (quotes.toscrape.com)
│   │   ├── scraper.py
│   │   └── data.json
│   ├── test-1/            # Timetable-only scraper
│   │   ├── scraper.py
│   │   ├── undergraduate.json
│   │   ├── postgraduate.json
│   │   └── research.json
│   └── test-2/            # Timetable + Handbook enrichment scraper
│       ├── scraper.py
│       └── data/
│           ├── undergraduate.json
│           ├── postgraduate.json
│           └── research.json
├── backend/               # (planned)
├── frontend/              # (planned)
└── README.md
```

---

## Running the Scraper

### Requirements
```bash
pip install httpx beautifulsoup4
```

### Run the full enrichment scraper (recommended)
```bash
cd data-scraping/test-2
python scraper.py
```

This will produce three JSON files under `data-scraping/test-2/data/`. Expect the run to take a while — there are thousands of courses and each one requires a handbook request with a 1-second delay.

---

## Tech Stack (Current)

| Layer | Tool |
|-------|------|
| HTTP client | `httpx` |
| HTML parsing | `BeautifulSoup4` |
| Data format | JSON |
| Language | Python 3.13 |

---

## Notes

- The scraper targets the 2026 academic year. Change the `YEAR` constant at the top of `scraper.py` to scrape a different year.
- Only Kensington campus courses are scraped (KENS suffix). Other campuses (e.g. Paddington) are out of scope for now.
- `prerequisites_raw` and `enrolment_rules_raw` are stored as raw HTML strings from the Handbook. Parsing these into a proper prerequisite graph is a planned task for Phase 3.
