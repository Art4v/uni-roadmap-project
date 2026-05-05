import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import importlib.util
spec = importlib.util.spec_from_file_location("pathway_parser", Path(__file__).parent / "pathway-parser.py")
pp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pp)

PDFS_DIR = Path(__file__).parent / "pdfs"

samples = [
    "3778_3778_-_Bachelor_Computer_Science_-_Computer_Science_-_COMPA1_-_T1_2026_Start.pdf",
    "3707_3707_-_Bachelor_Engineering_Honours_-_Software_Engineering_-_SENGAH_-_T1_2026_Start1.pdf",
    "8543_8543_-_Master_Information_Technology_-_Artificial_Intelligence_-_COMPLS_-_T1_2026_Start.pdf",
    "flexible-engineering_3707_-_1st_Yr_-_Bachelor_Engineering_Honours_-_Flexible_Engineering_-_Group_1_-_T1_2026_Start.pdf",
    "3635_3635_-_Engineering_Civil_Eng_w_Arch_Honours_-_T1_2026_Start.pdf",
]

for name in samples:
    path = PDFS_DIR / name
    print("=" * 100)
    print(name)
    print("=" * 100)
    if not path.exists():
        print("MISSING")
        continue
    try:
        data = pp.build_pathway(path)
    except Exception as e:
        print(f"ERROR: {e}")
        continue
    print(json.dumps(data, indent=2, ensure_ascii=False)[:4000])
    print()
