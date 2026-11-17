"""Sammelt Patchnotes für die Seite „Patchnotes“ und schreibt patchnotes.json.

Quellen (alle ohne Login lesbar, nur Standardbibliothek):
- Spectrum-Forum „Patch Notes“ (Kanal 190048): Liste der Beiträge und bei PTU-Builds und Hotfix-Central der Beitragstext selbst.
- RSI Comm-Link „Patch-Notes“: der vollständige Text der LIVE-Releases (die Spectrum-Beiträge dazu sind nur Kurzfassungen).
  Der Comm-Link lädt seinen Inhalt über eine zweite Adresse („htmlUrl“ in den Seitendaten); diese wird gelesen und in Abschnitte zerlegt.

Datenform pro Patch:
  id, kind (live | ptu | hotfix), version, title, date, mod, build, spectrum, full (Comm-Link oder null),
  units: [{t: Titel, c: Kapitel oder "", k: Art (feat | bal | fix | tech | known | info), n: [Knoten]}]
  Knoten: ["h", Titel] Zwischenüberschrift · ["p", Text] Absatz · ["i", Text, Ebene, [STARC-IDs], Hinweis] Listenpunkt
Texte bleiben Englisch (Originalwortlaut). Bereits geholte Patches werden nur neu gelesen, wenn Spectrum eine Änderung meldet.
"""
import html as H
import json, os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

UA = {"User-Agent": "SC-Handbuch-Patchnotes/1.0 (non-commercial fan guide; github.com/Plexxy94/SCHandbuch)"}
API = "https://robertsspaceindustries.com/api/spectrum/"
CHANNEL = "190048"
KEEP_LIVE, KEEP_PTU, KEEP_HOTFIX = 6, 6, 2
MAXTXT = 520
PARSER = 3     # bei Aenderungen am Lesen hochsetzen, damit alte Daten neu geholt werden
SKIP_TITLES = {"rsi launcher", "share feedback", "join the discussion", "report a bug"}
SKIP_TAGS = {"script", "style", "svg"}
LOREM = re.compile(r"voluptatem|dolores|consectetur|adipiscing|accusamus|perspiciatis|aspernatur", re.I)


def get(url, data=None):
    h = dict(UA)
    if data is not None:
        h["Content-Type"] = "application/json"
        data = json.dumps(data).encode()
    req = urllib.request.Request(url, data=data, headers=h, method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def api(path, body):
    d = json.loads(get(API + path, body))
    if not d.get("success"):
        raise RuntimeError(f"Spectrum {path}: {d.get('msg')}")
    return d["data"]


def clean(s):
    s = H.unescape(s).replace("\xa0", " ").replace("​", "")
    return re.sub(r"\s+", " ", s).strip()


def make_item(text, depth=0):
    """Listenpunkt: STARC-Nummern (Issue Council) abtrennen. Dahinter klebt oft eine Erklärung ohne Leerzeichen."""
    ids = re.findall(r"STARC-\d+", text)
    note = ""
    if ids:
        m = list(re.finditer(r"STARC-\d+", text))
        main = text[:m[0].start()].strip()
        note = text[m[-1].end():].strip()
        text = main or text
    node = ["i", text[:MAXTXT], depth, ids[:4]]
    if note:
        node.append(note[:MAXTXT])
    return node


def kind_of(title):
    t = title.lower()
    if re.search(r"known issue", t): return "known"
    if re.search(r"bug|fix|hotfixed|issue", t): return "fix"
    if re.search(r"stabil|perform|crash|technical|server|engine", t): return "tech"
    if re.search(r"balanc|tuning", t): return "bal"
    return "feat"


class Builder:
    """Sammelt Knoten in Abschnitten (units)."""

    def __init__(self):
        self.units = []
        self.chapter = ""
        self.cur = None
        self.label = None

    def unit(self, title, chapter=None):
        if chapter is not None:
            self.chapter = chapter
        self.flush_label()
        self.cur = {"t": title or "Info", "c": self.chapter, "k": kind_of((self.chapter + " " + title) if title else self.chapter), "n": []}
        self.units.append(self.cur)

    def ensure(self):
        if self.cur is None:
            self.unit("Info" if not self.units else "")

    def flush_label(self):
        if self.label:
            self.ensure()
            self.cur["n"].append(["p", self.label])
        self.label = None

    def heading(self, text):
        self.flush_label()
        self.ensure()
        self.cur["n"].append(["h", text[:140]])

    def para(self, text):
        if not text: return
        # kurze Zeile ohne Satzzeichen: mögliche Zwischenüberschrift, wenn danach eine Liste folgt
        self.flush_label()
        if len(text) <= 60 and not re.search(r"[.!?:]$", text) and not text.lower().startswith("http"):
            self.label = text
        else:
            self.ensure()
            self.cur["n"].append(["p", text[:MAXTXT * 2]])

    def item(self, text, depth=0):
        if not text: return
        if self.label:
            lab, self.label = self.label, None
            self.ensure()
            self.cur["n"].append(["h", lab])
        self.ensure()
        self.cur["n"].append(make_item(text, depth))

    def result(self):
        self.flush_label()
        out = []
        for u in self.units:
            if u["t"].strip().lower() in SKIP_TITLES: continue
            if u["n"]: out.append(u)
        return out


# ---------- Spectrum-Beitrag (Draft-Blöcke) ----------
def spectrum_units(blocks):
    b = Builder()
    first = True
    for x in blocks:
        t = clean(x.get("text", ""))
        ty = x.get("type", "")
        if not t: continue
        if re.match(r"^https?://", t):
            m = re.search(r"STARC-\d+", t)
            if m and b.cur and b.cur["n"] and b.cur["n"][-1][0] == "i" and m.group(0) not in b.cur["n"][-1][3]:
                b.cur["n"][-1][3].append(m.group(0))
            continue
        if ty.startswith("header"):
            b.unit(t, chapter=t); first = False
        elif ty == "blockquote":
            b.heading(t.lstrip("► ").strip())
        elif ty in ("unordered-list-item", "ordered-list-item"):
            if b.cur is None: b.unit("Info")
            b.item(t, x.get("depth", 0))
        else:
            if t.startswith(("►", "•")):
                if b.cur is None: b.unit("Info")
                b.item(t.lstrip("►• ").strip())
            else:
                if b.cur is None: b.unit("Info")
                b.para(t)
    return b.result()


# ---------- Comm-Link (HTML) ----------
TOK = re.compile(r"<(/?)(h[1-6]|p|li|ul|ol)\b[^>]*>", re.I)


class Notes:
    """Liest die Seite als Folge von Ueberschriften, Absaetzen und Listenpunkten.
    Der Artikeltext steckt im Comm-Link teils in Attributen der Web-Komponenten (g-article body=...); weil dort die Tags roh
    stehen, geht das Lesen ueber die Tag-Folge der ganzen Seite statt ueber einen strengen HTML-Parser."""

    def __init__(self):
        self.b = Builder(); self.list = 0; self.h2 = ""; self.build = None; self.last = ""

    def feed(self, raw):
        pos = 0; open_tag = None
        for m in TOK.finditer(raw):
            if open_tag:
                self.emit(open_tag, clean(re.sub(r"<[^>]*>", "", raw[pos:m.start()])))
                open_tag = None
            closing, tag = m.group(1) == "/", m.group(2).lower()
            if tag in ("ul", "ol"):
                self.list = max(0, self.list + (-1 if closing else 1))
            elif not closing:
                open_tag = tag
            pos = m.end()

    def emit(self, tag, text):
        if not text or LOREM.search(text) or text.startswith("{") or text.startswith("<"): return
        if tag in ("h1", "h2", "h3"):
            if text.lower() in SKIP_TITLES: self.b.unit(text, chapter=""); return
            if tag == "h2": self.h2 = text
            # eine leere h3-Zeile (z. B. „Balance and Tuning“) ist die Ueberschrift der folgenden h3-Abschnitte
            if tag == "h3" and self.b.cur is not None and not self.b.cur["n"] and self.last == "h3": self.h2 = self.b.cur["t"]
            self.last = tag
            self.b.unit(text, chapter=self.h2 if tag == "h3" else text)
        elif tag in ("h4", "h5", "h6"):
            self.b.heading(text)
        elif tag == "li":
            self.b.item(text, 0 if self.list <= 1 else 1)
        elif tag == "p":
            m = re.search(r"VERSION\s+([\w.\-]+)", text)
            if m and not self.build: self.build = m.group(1)
            if self.b.cur is None:
                return                       # Einleitung vor dem ersten Abschnitt (Werbetexte) weglassen
            self.b.para(text)


def full_notes(url):
    page = get(url).decode("utf-8", "replace")
    m = re.search(r'data-platform-client-props="([^"]+)"', page)
    props = json.loads(H.unescape(m.group(1)))
    hu = props["routerParams"]["props"]["content"]["htmlUrl"]
    body = get(hu).decode("utf-8", "replace")
    p = Notes(); p.feed(body)
    units = p.b.result()
    for u in units:                           # in der Einleitung stehen Werbe- und Geschichtentexte: nur Build-Angaben behalten
        if u["t"] == "Info" and not u["c"]:
            u["n"] = [n for n in u["n"] if n[0] != "p" or re.search(r"VERSION|Reminder", n[1])]
    return [u for u in units if u["n"]], p.build


# ---------- Hauptlauf ----------
def thread_blocks(slug):
    d = api("forum/thread/nested", {"slug": slug})
    blocks, links = [], []
    for c in d.get("content_blocks") or []:
        if c.get("type") != "text": continue
        data = c["data"]
        blocks += data.get("blocks", [])
        em = data.get("entityMap") or []
        em = em if isinstance(em, list) else list(em.values())
        links += [e["data"]["href"] for e in em if e.get("type") == "LINK" and e.get("data", {}).get("href")]
    return blocks, links, d


def classify(subj):
    if re.search(r"hotfix central", subj, re.I): return "hotfix"
    if re.search(r"LIVE Release Notes", subj, re.I): return "live"
    if re.search(r"PTU", subj, re.I) and re.search(r"patch notes|PTU \d{7}|PTU RC", subj, re.I): return "ptu"
    return None


def vkey(v):
    """'4.10.3' -> (4, 10, 3); fehlende Teile zaehlen als 0"""
    parts = [int(x) for x in re.findall(r"\d+", v or "")][:3]
    return tuple(parts + [0] * (3 - len(parts)))


def write_version(path, patches):
    """version.json: die EINE Quelle fuer die globale Version (LIVE) und die laufende Testversion.
    LIVE = neuester LIVE-Release, Test = neuester PTU-Build mit hoeherer Version als LIVE. Kein Zeitstempel der Pruefung,
    damit die Datei sich nur aendert, wenn sich der Patchstand aendert."""
    def pick(kind, newer_than=None):
        c = [x for x in patches if x.get("kind") == kind and x.get("version")]
        if newer_than: c = [x for x in c if vkey(x["version"]) > vkey(newer_than)]
        c.sort(key=lambda x: x["date"], reverse=True)
        if not c: return None
        x = c[0]
        return {"version": x["version"], "build": x.get("build"), "date": x["date"][:10], "url": x.get("full") or x.get("spectrum"), "kind": kind}
    live = pick("live")
    out = {"live": live, "test": pick("ptu", live["version"] if live else None), "source": "patchnotes.json"}
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)
        fh.write("\n")


def main(path):
    try:
        old = json.load(open(path, encoding="utf-8"))
    except Exception:
        old = {}
    known = {p["id"]: p for p in old.get("patches", [])} if old.get("v") == PARSER else {}
    threads = []
    for page in (1, 2):
        threads += api("forum/channel/threads", {"channel_id": CHANNEL, "page": page, "sort": "newest", "label_id": None}).get("threads") or []
    cand = {"live": [], "ptu": [], "hotfix": []}
    seen = set()
    for t in threads:
        if t["id"] in seen: continue
        seen.add(t["id"])
        k = classify(t.get("subject") or "")
        if k and t.get("slug"): cand[k].append(t)
    for k in cand: cand[k].sort(key=lambda t: -t["time_created"])
    chosen = cand["live"][:KEEP_LIVE] + cand["ptu"][:KEEP_PTU] + cand["hotfix"][:KEEP_HOTFIX]
    patches = []
    for t in chosen:
        pid = t["id"]; k = classify(t["subject"])
        prev = known.get(pid)
        if prev and prev.get("mod") == t["time_modified"] and prev.get("units"):
            patches.append(prev); continue
        try:
            blocks, links, _ = thread_blocks(t["slug"])
            subj = re.sub(r"\s+", " ", t["subject"]).strip()
            ver = (re.search(r"Alpha\s+(\d+\.\d+(?:\.\d+)?)", subj) or [None, ""])[1]
            build = (re.search(r"\b(\d{7,8})\b", subj) or [None, None])[1]
            full = next((l for l in links if "/comm-link/Patch-Notes/" in l), None)
            units = []
            if k == "live" and full:
                try:
                    units, b2 = full_notes(full)
                    build = b2 or build
                except Exception as exc:
                    print(f"Comm-Link {full}: {exc}", file=sys.stderr)
            if not units:
                units = spectrum_units(blocks)
            if not build:
                for x in blocks:
                    m = re.search(r"VERSION\s+([\w.\-]+)", x.get("text", ""))
                    if m: build = m.group(1); break
            patches.append({"id": pid, "kind": k, "version": ver, "title": subj, "date": datetime.fromtimestamp(t["time_created"], timezone.utc).isoformat(timespec="seconds"),
                            "mod": t["time_modified"], "build": (build or "").rstrip(". ") or None, "spectrum": "https://robertsspaceindustries.com/spectrum/community/SC/forum/%s/thread/%s" % (CHANNEL, t["slug"]),
                            "full": full if units and k == "live" and full else None, "units": units})
            print("ok", subj[:60], sum(len(u["n"]) for u in units), "Knoten")
        except Exception as exc:
            print(f"Fehler bei {t['subject'][:50]}: {exc}", file=sys.stderr)
            if prev: patches.append(prev)
        time.sleep(0.4)
    if not patches:
        print("keine Patches gelesen, alte Datei bleibt", file=sys.stderr); return
    patches.sort(key=lambda p: p["date"], reverse=True)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    new = {"v": PARSER, "patches": patches}
    same = {"v": old.get("v"), "patches": old.get("patches")} == new
    new["updated"] = old.get("updated", now) if same else now
    new["checked"] = now
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(new, fh, ensure_ascii=False, separators=(",", ":"))
    write_version(os.path.join(os.path.dirname(os.path.abspath(path)), "version.json"), patches)
    print("unverändert" if same else "aktualisiert", len(patches), "Patches")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "patchnotes.json")
