"""Erzeugt focus-pool.json für "Schiff im Fokus" auf der Startseite.

Für jedes Schiff aus ships.js wird bei FleetYards das aktuelle Holo-Modell
abgefragt (/v1/models/<slug>, Feld "holo") und tatsächlich heruntergeladen.
In den Pool kommen nur Modelle, die
  - ohne Login erreichbar sind (HTTP 200 nach der Weiterleitung),
  - CORS für fremde Seiten erlauben (Access-Control-Allow-Origin),
  - eine gültige glTF-Binärdatei sind (Magic "glTF"),
  - höchstens MAX_BYTES groß sind (Startseite soll schnell bleiben).
Varianten mit identischem Modell werden zusammengefasst (erstes Schiff gewinnt,
Grundmodelle zuerst).

Aufruf: python tools/build_focus_pool.py
"""
import json
import re
import sys
import time
import urllib.request

API = "https://api.fleetyards.net/v1/models/"
MAX_BYTES = 6 * 1024 * 1024
UA = {"User-Agent": "SCHandbuch focus-pool builder (https://plexxy94.github.io/SCHandbuch/)"}


def load_ships():
    src = open("ships.js", encoding="utf-8").read()
    m = re.search(r"window\.SHIPS\s*=\s*(\[.*?\]);", src, re.S)
    return json.loads(m.group(1))


def get(url, origin=False):
    h = dict(UA)
    if origin:
        h["Origin"] = "https://plexxy94.github.io"
    return urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=40)


def main():
    ships = [s for s in load_ships() if not s.get("veh")]
    # Grundmodelle zuerst, damit bei gleichem Modell nicht eine Sonderedition gewinnt
    ships.sort(key=lambda s: (bool(s.get("base")), s["slug"]))
    pool, seen, bad = [], set(), []
    for s in ships:
        slug = s["slug"]
        # FleetYards benennt manche Schiffe anders; der Link in "fy" enthält deren Kennung
        fy = re.search(r"/ships/([^/]+)/?$", s.get("fy") or "")
        try:
            info = json.load(get(API + (fy.group(1) if fy else slug)))
            holo = info.get("holo")
            if not holo:
                bad.append((slug, "kein Holo"))
                continue
            with get(holo, origin=True) as r:
                cors = r.headers.get("Access-Control-Allow-Origin")
                data = r.read(MAX_BYTES + 1)
            if data[:4] != b"glTF":
                bad.append((slug, "kein glTF"))
                continue
            if len(data) > MAX_BYTES:
                bad.append((slug, "zu groß"))
                continue
            if cors not in ("*", "https://plexxy94.github.io"):
                bad.append((slug, "kein CORS"))
                continue
            key = (len(data), data[:2048])
            if key in seen:
                continue
            seen.add(key)
            pool.append({"slug": slug, "holo": holo, "kb": round(len(data) / 1024)})
            print("ok ", slug, round(len(data) / 1024), "KB", flush=True)
        except Exception as e:  # noqa: BLE001 - jeder Fehler heißt: nicht in den Pool
            bad.append((slug, type(e).__name__))
        time.sleep(0.25)
    pool.sort(key=lambda p: p["slug"])
    with open("focus-pool.json", "w", encoding="utf-8") as f:
        json.dump({"checked": time.strftime("%Y-%m-%d"), "ships": pool}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n{len(pool)} Modelle im Pool, {len(bad)} aussortiert", file=sys.stderr)
    for slug, why in bad:
        print("  -", slug, why, file=sys.stderr)


if __name__ == "__main__":
    main()
