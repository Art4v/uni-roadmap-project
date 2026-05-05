import pdfplumber
from pathlib import Path

PDFS_DIR = Path(__file__).parent / "pdfs"

samples = [
    "3778_3778_-_Bachelor_Computer_Science_-_Computer_Science_-_COMPA1_-_T1_2026_Start.pdf",
    "3707_3707_-_Bachelor_Engineering_Honours_-_Software_Engineering_-_SENGAH_-_T1_2026_Start1.pdf",
    "8543_8543_-_Master_Information_Technology_-_Artificial_Intelligence_-_COMPLS_-_T1_2026_Start.pdf",
    "flexible-engineering_3707_-_1st_Yr_-_Bachelor_Engineering_Honours_-_Flexible_Engineering_-_Group_1_-_T1_2026_Start.pdf",
]

for name in samples:
    path = PDFS_DIR / name
    print("=" * 80)
    print(name)
    print("=" * 80)
    if not path.exists():
        print("MISSING")
        continue
    with pdfplumber.open(path) as pdf:
        print(f"pages: {len(pdf.pages)}")
        page = pdf.pages[0]
        text = page.extract_text() or ""
        print("--- first page text (first 1200 chars) ---")
        print(text[:1200])
        print()
        print("--- tables on first page ---")
        tables = page.extract_tables()
        print(f"table count on page 0: {len(tables)}")
        for i, t in enumerate(tables):
            print(f"table {i}: rows={len(t)}")
            for row in t[:6]:
                print("  ", row)
        print()
        print("--- font sample (first 30 chars w/ fontname) ---")
        for ch in page.chars[:30]:
            print(f"  {ch.get('text')!r:<6} fontname={ch.get('fontname')}")
    print()
