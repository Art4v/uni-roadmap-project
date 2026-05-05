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

### Phase 1 — UNSW Timetable Scraper ✅
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

**Limitations:**
- No term/offering information
- No prerequisites or enrolment rules
- No faculty, school, campus, or description data

---

### Phase 2 — Timetable + Handbook Enrichment ✅
**Location:** `data-scraping/classes-scraper/`

Major improvement over Phase 1. After scraping course codes from the timetable, this scraper does a second pass through the [UNSW Handbook](https://www.handbook.unsw.edu.au) to enrich every course with the full set of metadata. Handbook data is embedded in a `__NEXT_DATA__` JSON blob in each course's page.

**Output:** `data-scraping/classes-data/` — `undergraduate.json`, `postgraduate.json`, `research.json`

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

### Phase 3 — Pathway PDF Scraper + Parser ✅
**Location:** `data-scraping/pathway-scraper/`

Scrapes and parses degree pathway templates (progression checksheets) for UNSW Engineering programs. These are PDF documents that show the recommended course sequence for each specialisation and start term.

**Two scripts:**

- `pathway-scraper.py` — fetches the Engineering student resources index, finds all PDF links, and downloads ~612 checksheet PDFs to `pdfs/`
- `pathway-parser.py` — uses `pdfplumber` to parse each PDF, extracts the program name, specialisation code, start term, and a year/term grid of courses with their prerequisites

**Output:** `pathways-data/` — 613 structured JSON files, one per checksheet, plus an `index.json` summary

**Each pathway entry contains:**
```json
{
  "program": "Bachelor of Engineering (Honours)",
  "program_code": "3707",
  "specialisation": "Computer Science",
  "specialisation_code": "COMPAH",
  "start_term": "T1",
  "start_year": 2026,
  "courses": [
    {
      "year": 1,
      "term": 1,
      "code": "COMP1511",
      "title": "Programming Fundamentals",
      "prerequisites": ""
    }
  ]
}
```

---

### Phase 4 — Frontend MVP 🚧 (In Progress)
**Location:** `frontend/`

An interactive web app for exploring courses and pathway data. The MVP is built with React, Vite, and Tailwind CSS, using pre-processed data loaded from `src/data.js`.

**Stack:**
- React 18 + Vite
- Tailwind CSS
- Data sourced from scraped JSON (classes + pathways)

**Planned full features:**
- Course search and filter by faculty, level, term, UOC
- Prerequisite chain visualisation (node graph, e.g. using React Flow or D3.js)
- Drag-and-drop degree planner — assign courses to terms across multiple years
- Automatic conflict detection (exclusions, term clashes)
- Shareable/exportable degree plan

---

### Phase 5 — Database + Backend API 🔲 (Planned)
**Location:** `backend/` *(to be created)*

Load the scraped JSON data into a proper database and expose it via a REST or GraphQL API.

**Planned stack:**
- **Database:** PostgreSQL
- **ORM / API:** Python (FastAPI) or Node.js (Express)
- **Endpoints:**
  - `GET /courses` — list/search all courses with filters (level, faculty, term, UOC)
  - `GET /courses/:code` — full detail for a single course
  - `GET /courses/:code/prerequisites` — prerequisite graph for a course
  - `GET /pathways` — list all degree pathways
  - `POST /planner` — save/load a student's personal degree plan

---

### Phase 6 — Deployment 🔲 (Planned)
- Frontend: Vercel or Netlify
- Backend + DB: Railway, Render, or a VPS
- CI/CD: GitHub Actions for automated scraper refresh (run each year when UNSW publishes new timetable data)

---

## Repository Structure

```
uni-roadmap-project/
├── data-scraping/
│   ├── learning/               # Phase 0 — practice scraper (quotes.toscrape.com)
│   │   ├── scraper.py
│   │   └── data.json
│   ├── test-1/                 # Phase 1 — timetable-only scraper (superseded)
│   │   ├── scraper.py
│   │   ├── undergraduate.json
│   │   ├── postgraduate.json
│   │   └── research.json
│   ├── classes-scraper/        # Phase 2 — current working course scraper
│   │   └── scraper.py
│   ├── classes-data/           # Phase 2 — committed snapshot of scraped courses
│   │   ├── undergraduate.json
│   │   ├── postgraduate.json
│   │   └── research.json
│   └── pathway-scraper/        # Phase 3 — pathway PDF scraper + parser
│       ├── pathway-scraper.py
│       ├── pathway-parser.py
│       ├── pdfs/               # ~612 downloaded checksheet PDFs
│       └── pathways-data/      # ~613 structured JSON files + index.json
├── frontend/                   # Phase 4 — MVP frontend (React + Vite + Tailwind)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components.jsx
│   │   ├── data.js
│   │   ├── icons.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                    # Phase 5 — (planned)
├── CLAUDE.md
└── README.md
```

---

## Running the Scrapers

### Requirements
```bash
pip install httpx beautifulsoup4 pdfplumber
```

### Course scraper (Phase 2)
```bash
cd data-scraping/classes-scraper
python scraper.py
```
Outputs to `data-scraping/classes-scraper/data/`. Expect a long run — thousands of handbook requests with a 1-second delay each.

### Pathway scraper (Phase 3)
```bash
# Step 1: download PDFs
cd data-scraping/pathway-scraper
python pathway-scraper.py

# Step 2: parse PDFs to JSON
python pathway-parser.py
```
Downloads ~612 PDFs to `pdfs/` then parses them into `pathways-data/`.

### Frontend (Phase 4)
```bash
cd frontend
npm install
npm run dev
```

---

## Tech Stack (Current)

| Layer | Tool |
|-------|------|
| HTTP client | `httpx` |
| HTML parsing | `BeautifulSoup4` |
| PDF parsing | `pdfplumber` |
| Data format | JSON |
| Scraping language | Python 3.13 |
| Frontend | React 18 + Vite + Tailwind CSS |

---

## Notes

- The scrapers target the 2026 academic year. Change the `YEAR` constant at the top of `scraper.py` to scrape a different year.
- Only Kensington campus courses are scraped (KENS suffix). Other campuses are out of scope for now.
- `prerequisites_raw` and `enrolment_rules_raw` are stored as raw strings from the Handbook. Parsing these into a proper prerequisite graph is a planned task for Phase 5.
- Pathway checksheets are currently limited to UNSW Engineering programs (the only faculty that publishes progression checksheets as PDFs).
