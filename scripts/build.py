"""Copy the one-page frontend into frontend/dist. Run: python3 scripts/build.py"""
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent.parent
FRONT = ROOT / "frontend"
PUBLIC, DIST = FRONT / "public", FRONT / "dist"
STALE = ["works", "drawing", "construction", "name", "table"]


def build():
    DIST.mkdir(parents=True, exist_ok=True)
    subprocess.run(["node", str(ROOT / "scripts/bundle-table.mjs")], cwd=ROOT, check=True)
    for src in PUBLIC.iterdir():
        if src.is_file():
            shutil.copy2(src, DIST / src.name)
    shutil.copy2(FRONT / "index.html", DIST / "index.html")
    key = ROOT / "key.txt"
    if key.is_file():
        shutil.copy2(key, DIST / "key.txt")
    for name in STALE:
        folder = DIST / name
        if folder.is_dir():
            shutil.rmtree(folder)
    print(f"index.html     -> frontend/dist/index.html  ({(DIST / 'index.html').stat().st_size} B)")
    print(f"table.js       -> frontend/dist/table.js  ({(DIST / 'table.js').stat().st_size} B)")


if __name__ == "__main__":
    build()
