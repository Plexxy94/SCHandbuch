#!/usr/bin/env python3
"""CCU-Radar: Pledge-Preise (USD) aus der Upgrade-API des RSI-Stores und Ankündigungen aus Spectrum.

Aufruf: python3 tools/fetch_ccu.py [Zielordner]
Schreibt pledge.json (aktueller Stand), pledge-history.json (Änderungen) und ccu.json (Meldungen).
Läuft ohne Login mit dem anonymen Gast-Token des Stores. Nur Standardbibliothek.
Die API ist inoffiziell: Fällt eine Quelle aus, bleiben die alten Daten stehen und ccu.json nennt den Fehler.
"""
import http.cookiejar
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

RSI = "https://robertsspaceindustries.com"
UA = "Mozilla/5.0 (compatible; sc-handbuch-ccu-radar)"
NOW = datetime.now(timezone.utc)
TODAY = NOW.date().isoformat()

# Hersteller-Tage der IAE 2956. Der Zeitplan-Comm-Link ist nicht maschinell lesbar, darum von Hand.
# Nur eintragen, was geprüft ist. Fehlt ein Hersteller, nennt die Meldung die Frist nur als Text.
MFR_DAYS = {
    "MISC": "2026-11-19",
}
SCHEDULE_URL = RSI + "/en/comm-link/transmission/21386-Intergalactic-Aerospace-Expo-2956-Free-Fly-And-Manufacturer-Schedule"
SPECTRUM_CHANNEL = "1"      # Announcements
THREAD_DAYS = 30            # so alte Threads werden noch gelesen
KEEP_DONE_DAYS = 14         # erledigte Meldungen so lange zeigen

jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), method="POST",
                                 headers={"User-Agent": UA, "Content-Type": "application/json", "Accept": "application/json"})
    with opener.open(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def gql(query, variables=None):
    d = post(RSI + "/pledge-store/api/upgrade/graphql", {"query": query, "variables": variables or {}})
    if d.get("errors"):
        raise RuntimeError(d["errors"][0].get("message", "GraphQL-Fehler"))
    return d["data"]


def usd(cents):
    """Cent -> Dollar, ganze Beträge als int."""
    v = cents / 100
    return int(v) if v == int(v) else round(v, 2)


# ---------------------------------------------------------------- Store

def fetch_pledge():
    post(RSI + "/api/account/v2/setAuthToken", {})
    post(RSI + "/api/ship-upgrades/setContextToken", {})
    data = gql("query { ships { id name manufacturer { name } flyableStatus msrp "
               "skus { id title available price } } app { pricing { currencyCode } isAnonymous } }")
    cur = (data.get("app") or {}).get("pricing", {}).get("currencyCode")
    if cur != "USD":
        raise RuntimeError("Store liefert %s statt USD" % cur)
    # Die Schiffsliste führt auch alte Angebote als „available“. Was der Upgrade-Rechner wirklich anbietet,
    # zeigt nur die Zielliste ab dem billigsten Schiff: Nur diese Angebote zählen.
    cheapest = min((s for s in data["ships"] if s.get("msrp")), key=lambda s: s["msrp"])
    offer = gql("query($f: Int) { to(from: $f, filters: []) { ships { id skus { id } } } }", {"f": cheapest["id"]})
    live = {k["id"] for x in offer["to"]["ships"] for k in x["skus"]}
    if len(live) < 5:
        raise RuntimeError("nur %d aktuelle Angebote erhalten" % len(live))
    ships = []
    for s in data["ships"]:
        if not s.get("msrp"):
            continue
        skus = [{"id": k["id"], "title": k["title"].strip(), "price": usd(k["price"]),
                 "wb": "warbond" in k["title"].lower()}
                for k in (s.get("skus") or []) if k.get("available") and k["id"] in live]
        ships.append({"id": s["id"], "name": s["name"].strip(), "mfr": (s.get("manufacturer") or {}).get("name", ""),
                      "msrp": usd(s["msrp"]), "fly": s.get("flyableStatus") == "Flyable",
                      "skus": sorted(skus, key=lambda k: k["id"])})
    if len(ships) < 100:
        raise RuntimeError("nur %d Schiffe erhalten" % len(ships))
    return sorted(ships, key=lambda s: s["id"])


def diff_pledge(old, new):
    """Änderungen zwischen zwei Ständen als Liste für die Historie."""
    out, o = [], {s["id"]: s for s in old}
    for s in new:
        p = o.get(s["id"])
        if p is None:
            out.append({"d": TODAY, "id": s["id"], "name": s["name"], "k": "new", "new": s["msrp"]})
            continue
        if p["msrp"] != s["msrp"]:
            out.append({"d": TODAY, "id": s["id"], "name": s["name"], "k": "msrp", "old": p["msrp"], "new": s["msrp"]})
        ps, ns = {k["id"]: k for k in p["skus"]}, {k["id"]: k for k in s["skus"]}
        for i, k in ns.items():
            if i not in ps:
                out.append({"d": TODAY, "id": s["id"], "name": s["name"], "k": "sku+", "sku": i, "title": k["title"], "new": k["price"]})
            elif ps[i]["price"] != k["price"]:
                out.append({"d": TODAY, "id": s["id"], "name": s["name"], "k": "sku", "sku": i, "title": k["title"],
                            "old": ps[i]["price"], "new": k["price"]})
        for i, k in ps.items():
            if i not in ns:
                out.append({"d": TODAY, "id": s["id"], "name": s["name"], "k": "sku-", "sku": i, "title": k["title"], "old": k["price"]})
    return out


def std_sku(ship):
    for k in ship["skus"]:
        if not k["wb"] and k["title"].lower().startswith("standard"):
            return k
    return None


def from_ids(sku_id):
    """Welche Schiffe der Store als Quelle für dieses Ziel-SKU zulässt."""
    d = gql("query($to: Int) { from(to: $to, filters: []) { ships { id } } }", {"to": sku_id})
    return {x["id"] for x in d["from"]["ships"]}


def ccu_price(from_id, sku_id):
    d = gql("query($from: Int!, $to: Int!) { price(from: $from, to: $to) { amount } }", {"from": from_id, "to": sku_id})
    return usd(d["price"]["amount"])


def pick_source(ships, target, limit, allowed=None):
    """Quellschiff: unter `limit` Dollar, möglichst nah dran, bevorzugt mit Standard-SKU (einzeln kaufbar) und flugfähig."""
    c = [s for s in ships if s["id"] != target["id"] and s["msrp"] < limit and (allowed is None or s["id"] in allowed)]
    if not c:
        return None, []
    c.sort(key=lambda s: (-(std_sku(s) is not None), -s["msrp"], -s["fly"], s["name"]))
    best_std = [s for s in c if std_sku(s)]
    pool = best_std or c
    top = pool[0]["msrp"]
    same = [s for s in pool if s["msrp"] == top]
    same.sort(key=lambda s: (-s["fly"], s["name"]))
    return same[0], same[1:4]


# ---------------------------------------------------------------- Spectrum

def thread_text(slug):
    d = post(RSI + "/api/spectrum/forum/thread/nested", {"slug": slug, "sort": "votes", "target_reply_id": None})
    lines = []
    for b in (d.get("data") or {}).get("content_blocks") or []:
        data = b.get("data")
        if isinstance(data, dict):
            lines += [x.get("text", "") for x in data.get("blocks", [])]
    return "\n".join(lines)


def fetch_threads():
    d = post(RSI + "/api/spectrum/forum/channel/threads",
             {"channel_id": SPECTRUM_CHANNEL, "page": 1, "sort": "newest", "label_id": None})
    since = (NOW - timedelta(days=THREAD_DAYS)).timestamp()
    out = []
    for t in (d.get("data") or {}).get("threads") or []:
        if max(t.get("time_created") or 0, t.get("time_modified") or 0) < since:
            continue
        try:
            text = thread_text(t["slug"])
        except Exception as e:      # ein kaputter Thread soll den Lauf nicht stoppen
            print("Thread %s nicht lesbar: %s" % (t.get("slug"), e))
            continue
        out.append({"id": t["id"], "title": t.get("subject", ""), "text": text,
                    "date": datetime.fromtimestamp(t.get("time_created") or 0, timezone.utc).date().isoformat(),
                    "url": "%s/spectrum/community/SC/forum/%s/thread/%s" % (RSI, SPECTRUM_CHANNEL, t["slug"])})
    return out


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", s.lower()).strip()


def find_ships(sentence, ships):
    """Schiffsnamen im Satz, längster Treffer zuerst; ein kürzerer Name in einem längeren zählt nicht doppelt."""
    text = " " + norm(sentence) + " "
    hits = []
    for s in sorted(ships, key=lambda s: -len(s["name"])):
        n = norm(s["name"])
        if len(n) < 3:
            continue
        if (" " + n + " ") in text:
            hits.append(s)
            text = text.replace(" " + n + " ", " # ")
    return hits


RE_UP = re.compile(r"(?i)\b(increas\w*|go(?:es|ing)? up|rais\w*|ris(?:e|es|ing)|higher)\b")
RE_PRICE = re.compile(r"(?i)\b(price\w*|cost\w*|msrp|pledge value)\b")
RE_FROM_TO = re.compile(r"(?i)from\s+\$\s?([\d,]+)(?:\s*USD)?\s+to\s+\$\s?([\d,]+)")
RE_BY = re.compile(r"(?i)\bby\s+\$\s?([\d,]+)")
RE_WHEN = re.compile(r"(?i)\bon\s+((?:the\s+)?[A-Z][\w&' -]{1,30}?\s+Day(?:\s+of\s+IAE)?|(?:January|February|March|April|May|June|July|August|"
                     r"September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?)")
RE_FLY = re.compile(r"(?i)\b(flight[- ]ready|straight[- ]to[- ]flyable|becom\w+ flyable|now flyable)\b")
MONTHS = {m: i + 1 for i, m in enumerate("january february march april may june july august september october november december".split())}


def deadline(when):
    """Aus „MISC Day of IAE“ oder „November 19“ ein Datum machen, wenn möglich. Gibt (iso oder None, Text) zurück."""
    if not when:
        return None, ""
    m = re.match(r"(?i)(?:the\s+)?(.+?)\s+Day", when)
    if m:
        key = m.group(1).strip()
        for k, v in MFR_DAYS.items():
            if k.lower() == key.lower():
                return v, when
        return None, when
    m = re.match(r"(?i)([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?", when)
    if m and m.group(1).lower() in MONTHS:
        y = int(m.group(3) or NOW.year)
        try:
            return datetime(y, MONTHS[m.group(1).lower()], int(m.group(2))).date().isoformat(), when
        except ValueError:
            pass
    return None, when


def scan(threads, ships):
    """Stichwortregeln auf den Thread-Texten. Liefert rohe Funde."""
    found = []
    for t in threads:
        for sent in re.split(r"\n+|(?<=[.!?])\s+(?=[A-Z])", t["text"]):
            if len(sent) < 20 or len(sent) > 600:
                continue
            up = RE_UP.search(sent) and RE_PRICE.search(sent)
            fly = RE_FLY.search(sent)
            if not up and not fly:
                continue
            hit = find_ships(sent, ships)
            if not hit:
                continue
            ft, by, wh = RE_FROM_TO.search(sent), RE_BY.search(sent), RE_WHEN.search(sent)
            for s in hit[:3]:
                if up:
                    old = int(ft.group(1).replace(",", "")) if ft else None
                    new = int(ft.group(2).replace(",", "")) if ft else None
                    if new is None and by:
                        old, new = s["msrp"], s["msrp"] + int(by.group(1).replace(",", ""))
                    found.append({"type": "increase", "ship": s, "old": old, "new": new, "when": wh.group(1) if wh else "", "thread": t})
                elif fly and s["fly"] is False:
                    found.append({"type": "flyable", "ship": s, "old": None, "new": None, "when": "", "thread": t})
    return found


# ---------------------------------------------------------------- Auswertung

def build_hits(found, ships, old_hits, history):
    old = {h["id"]: h for h in old_hits}
    hits, seen = [], set()
    for f in found:
        s = f["ship"]
        hid = "%s-%d-%s" % (f["type"], s["id"], f["new"] or "x")
        if hid in seen:
            continue
        seen.add(hid)
        prev = old.get(hid, {})
        h = {"id": hid, "type": f["type"], "ship": s["name"], "mfr": s["mfr"], "ship_id": s["id"],
             "now": s["msrp"], "old": f["old"], "new": f["new"],
             "src": {"title": f["thread"]["title"], "url": f["thread"]["url"], "date": f["thread"]["date"], "site": "Spectrum"},
             "first_seen": prev.get("first_seen", TODAY)}
        iso, text = deadline(f["when"])
        h["deadline"], h["deadline_text"] = iso, text
        if text and not iso and "day" in text.lower():
            h["deadline_url"] = SCHEDULE_URL
        if f["type"] == "increase" and f["new"]:
            h["done"] = s["msrp"] >= f["new"]
            if h["done"]:
                h["done_since"] = prev.get("done_since", TODAY)
            sku = std_sku(s)
            if sku and not h["done"]:
                try:
                    allowed = from_ids(sku["id"])
                    src, alts = pick_source(ships, s, sku["price"], allowed)
                    if src:
                        price = ccu_price(src["id"], sku["id"])
                        h["from"] = {"name": src["name"], "msrp": src["msrp"], "std": std_sku(src) is not None, "fly": src["fly"]}
                        h["alts"] = [a["name"] for a in alts]
                        h["ccu"] = price
                        h["value"] = f["new"] - src["msrp"]
                        h["saving"] = h["value"] - price
                except Exception as e:
                    h["note"] = "Quellschiff nicht ermittelbar: %s" % e
            elif not sku and not h["done"]:
                h["note"] = "Für dieses Schiff bietet der Store gerade kein Standard-Upgrade an."
            if h.get("done") and "from" in prev:      # Rechnung der letzten offenen Fassung behalten
                for k in ("from", "alts", "ccu", "value", "saving"):
                    if k in prev:
                        h[k] = prev[k]
        hits.append(h)
    # Erledigte Meldungen, die im Text nicht mehr auftauchen, eine Weile weiterzeigen
    for hid, h in old.items():
        if hid not in seen and h.get("type") in ("increase", "flyable"):
            ref = h.get("done_since") or h.get("first_seen") or TODAY
            if (NOW.date() - datetime.fromisoformat(ref).date()).days <= KEEP_DONE_DAYS:
                hits.append(h)
    # Stille Erhöhungen aus der Historie (zu spät für den günstigen CCU, aber gut zu wissen)
    limit = (NOW.date() - timedelta(days=KEEP_DONE_DAYS)).isoformat()
    announced = {(h["ship_id"], h.get("new")) for h in hits if h["type"] == "increase"}
    for e in history:
        if e["k"] == "msrp" and e["d"] >= limit and e["new"] > e["old"] and (e["id"], e["new"]) not in announced:
            hits.append({"id": "raised-%d-%s" % (e["id"], e["new"]), "type": "raised", "ship": e["name"], "ship_id": e["id"],
                         "old": e["old"], "new": e["new"], "now": e["new"], "first_seen": e["d"], "done": True,
                         "src": {"title": "Preisvergleich mit dem Vortag", "url": RSI + "/pledge/ship-upgrades", "date": e["d"], "site": "Pledge-Store"}})
    order = {"increase": 0, "flyable": 1, "raised": 2}
    hits.sort(key=lambda h: (bool(h.get("done")), order.get(h["type"], 9), h.get("deadline") or "9999", -(h.get("saving") or 0)))
    return hits


def build_warbond(ships, history):
    """Warbond-Upgrades, die der Upgrade-Rechner gerade anbietet. Quellschiff und Preis je Zeile beim Store abgefragt."""
    fresh = {(e["id"], e.get("sku")) for e in history
             if e["k"] == "sku+" and e["d"] >= (NOW.date() - timedelta(days=3)).isoformat()}
    out = []
    for s in ships:
        wb = [k for k in s["skus"] if k["wb"] and k["price"] < s["msrp"]]
        if not wb:
            continue
        k = min(wb, key=lambda k: k["price"])
        try:
            src, _ = pick_source(ships, s, k["price"], from_ids(k["id"]))
            if not src:
                continue
            price = ccu_price(src["id"], k["id"])
        except Exception as e:
            print("Warbond %s nicht prüfbar: %s" % (s["name"], e))
            continue
        out.append({"ship": s["name"], "mfr": s["mfr"], "msrp": s["msrp"], "wb": k["price"],
                    "from": src["name"], "from_msrp": src["msrp"], "ccu": price,
                    "value": s["msrp"] - src["msrp"], "saving": s["msrp"] - src["msrp"] - price,
                    "new": (s["id"], k["id"]) in fresh})
    out.sort(key=lambda w: (-w["new"], -w["saving"], w["ship"]))
    return out


def load(path, default):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return default


def dump(path, data, compact=False):
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        if compact:
            # eine Zeile je Eintrag: kleine Diffs im Repo
            fh.write('{"updated": %s, "ships": [\n' % json.dumps(data["updated"]))
            fh.write(",\n".join(json.dumps(s, ensure_ascii=False, separators=(",", ":")) for s in data["ships"]))
            fh.write("\n]}\n")
        else:
            json.dump(data, fh, ensure_ascii=False, indent=1)
            fh.write("\n")


def main(folder):
    p_pledge, p_hist, p_ccu = (os.path.join(folder, n) for n in ("pledge.json", "pledge-history.json", "ccu.json"))
    old_pledge = load(p_pledge, {})
    history = load(p_hist, [])
    old_ccu = load(p_ccu, {})
    errors = []

    ships = old_pledge.get("ships") or []
    try:
        new_ships = fetch_pledge()
        if ships:
            changes = diff_pledge(ships, new_ships)
            if changes:
                history = (history + changes)[-2000:]
                dump(p_hist, history)
                print("%d Preisänderungen" % len(changes))
        elif not os.path.exists(p_hist):
            dump(p_hist, [])
        if new_ships != ships:
            dump(p_pledge, {"updated": NOW.isoformat(timespec="seconds"), "ships": new_ships}, compact=True)
        ships = new_ships
    except Exception as e:
        errors.append("Pledge-Store: %s" % e)
        print("Pledge-Store nicht lesbar:", e)

    found, threads_n = None, 0
    if ships:
        try:
            threads = fetch_threads()
            threads_n = len(threads)
            found = scan(threads, ships)
        except Exception as e:
            errors.append("Spectrum: %s" % e)
            print("Spectrum nicht lesbar:", e)

    old_hits = old_ccu.get("hits") or []
    hits = build_hits(found, ships, old_hits, history) if found is not None and "Pledge-Store" not in " ".join(errors) else old_hits
    warbond = build_warbond(ships, history) if ships and not any(e.startswith("Pledge") for e in errors) else old_ccu.get("warbond") or []
    dump(p_ccu, {"checked": NOW.isoformat(timespec="seconds"), "threads": threads_n, "errors": errors,
                 "hits": hits, "warbond": warbond})
    print("%d Meldungen, %d Warbond-Upgrades, %d Threads gelesen" % (len(hits), len(warbond), threads_n))
    for h in hits:
        print(" -", h["type"], h["ship"], h.get("old"), "->", h.get("new"), "| Frist", h.get("deadline") or h.get("deadline_text"),
              "| von", (h.get("from") or {}).get("name"), "| CCU", h.get("ccu"), "| spart", h.get("saving"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else ".")
