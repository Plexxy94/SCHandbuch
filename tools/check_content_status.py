#!/usr/bin/env python3
"""Prueft content-status.json (Pruefstand je Seite). Nur Standardbibliothek.
Aufruf im Projektordner:  python tools/check_content_status.py
Rueckgabewert 1 bei Fehlern, 0 sonst. Hinweise (WARN) brechen nicht ab."""
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
errors, warns = [], []


def err(m): errors.append(m)
def warn(m): warns.append(m)


def vkey(v):
    return tuple(int(x) for x in re.findall(r"\d+", v)[:3]) + (0,) * (3 - len(re.findall(r"\d+", v)[:3]))


try:
    data = json.loads((ROOT / "content-status.json").read_text(encoding="utf-8"))
except Exception as e:
    print("FEHLER: content-status.json nicht lesbar:", e); sys.exit(1)
html = (ROOT / "index.html").read_text(encoding="utf-8")
views = set(re.findall(r'id="view-([a-z0-9-]+)"', html))
tagged = set(re.findall(r'data-vpage="([a-z0-9-]+)"', html))
try:
    live = json.loads((ROOT / "version.json").read_text(encoding="utf-8"))["live"]["version"]
except Exception:
    live = None; warn("version.json nicht lesbar, Vergleich mit LIVE entfaellt")

pages, hubs = data.get("pages", {}), data.get("hubs", {})
ALLOWED = {"patch", "date", "basis", "state", "reason", "kind", "intern", "note"}
today = date.today()
for k, p in pages.items():
    if k not in views: err(f"pages.{k}: keine Ansicht view-{k} in index.html")
    if k not in tagged: warn(f"pages.{k}: Ansicht hat keine Kennzeichnung (data-vpage) im Seitenkopf")
    extra = set(p) - ALLOWED
    if extra: err(f"pages.{k}: unbekannte Felder {sorted(extra)}")
    patch = p.get("patch")
    if patch is not None and not re.fullmatch(r"\d+\.\d+(\.\d+)?", str(patch)): err(f"pages.{k}: patch '{patch}' hat kein Versionsformat")
    d = p.get("date")
    if d is not None:
        if not re.fullmatch(r"\d{4}-\d{2}(-\d{2})?", str(d)): err(f"pages.{k}: date '{d}' hat nicht das Format JJJJ-MM oder JJJJ-MM-TT")
        else:
            try:
                dd = datetime.strptime(str(d) + ("-01" if len(str(d)) == 7 else ""), "%Y-%m-%d").date()
                if dd > today: err(f"pages.{k}: date {d} liegt in der Zukunft")
            except ValueError: err(f"pages.{k}: date '{d}' ist kein gueltiges Datum")
    if not str(p.get("basis", "")).strip(): err(f"pages.{k}: basis fehlt")
    st = p.get("state")
    if st is not None and st not in ("teilweise", "veraltet"): err(f"pages.{k}: state '{st}' ist nicht teilweise oder veraltet")
    if st and not str(p.get("reason", "")).strip(): err(f"pages.{k}: state '{st}' verlangt reason")
    if p.get("reason") and not st: warn(f"pages.{k}: reason ohne state wird nicht als Abweichung angezeigt")
    if st == "veraltet" and not patch: warn(f"pages.{k}: veraltet ohne patch")
    if patch and live and vkey(patch) > vkey(live): err(f"pages.{k}: patch {patch} ist neuer als LIVE {live}")
    if st == "teilweise" and patch and live and vkey(patch) >= vkey(live): warn(f"pages.{k}: teilweise, aber patch entspricht schon LIVE {live}: Abweichung noch aktuell?")
    if patch and not d: warn(f"pages.{k}: kein Pruefdatum")
for k in tagged - set(pages) - set(hubs):
    warn(f"Ansicht {k}: Kennzeichnung im Kopf, aber kein Eintrag in pages oder hubs")
for h, v in hubs.items():
    if h not in views: err(f"hubs.{h}: keine Ansicht view-{h}")
    for c in v.get("from", []):
        if c not in pages and c not in hubs: err(f"hubs.{h}: Unterseite '{c}' fehlt in pages und hubs")
seen = {}
def walk(h, trail):
    if h in trail: err("hubs: Zyklus " + " -> ".join(trail + [h])); return
    for c in hubs.get(h, {}).get("from", []):
        if c in hubs: walk(c, trail + [h])
for h in hubs: walk(h, [])

for w in warns: print("WARN  ", w)
for e in errors: print("FEHLER", e)
n_state = {}
for p in pages.values():
    s = p.get("state") or ("unbekannt" if not p.get("patch") else ("aktuell" if live and vkey(p["patch"]) >= vkey(live) else "frueher"))
    n_state[s] = n_state.get(s, 0) + 1
print(f"{len(pages)} Seiten, {len(hubs)} Hubs, LIVE {live}: {n_state}")
sys.exit(1 if errors else 0)
