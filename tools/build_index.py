#!/usr/bin/env python3
"""
Builds a lightweight search index from JSON files under ./workflows
Usage:
  python tools/build_index.py
Outputs:
  ./search/index.json
"""
import json, os, re, glob, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
WF_DIR = ROOT / "workflows"
OUT = ROOT / "search" / "index.json"
OUT.parent.mkdir(parents=True, exist_ok=True)

def summary_of(obj):
  # naive summary from name/notes or first 200 chars
  txt = obj.get("name") or obj.get("notes") or ""
  if not txt:
    txt = json.dumps(obj)[:200]
  return re.sub(r"\s+", " ", txt).strip()[:240]

items = []
for p in sorted(WF_DIR.glob("*.json")):
  try:
    j = json.loads(p.read_text(encoding="utf-8"))
  except Exception:
    continue
  title = j.get("name") or p.stem
  tags = j.get("tags") or []
  if isinstance(tags, str):
    tags = [tags]
  items.append({
    "id": p.stem,
    "title": title,
    "tags": tags,
    "summary": summary_of(j),
    "path": f"workflows/{p.name}",
  })

OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(items)} items to {OUT}")
