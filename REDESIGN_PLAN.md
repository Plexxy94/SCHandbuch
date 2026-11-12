# Redesign v2 – Arbeitsplan und Risiken

> Hinweis: Dieses Dokument entstand im Vorgänger-Repository `SCfueRoony` auf dem Branch `redesign/v2`. Dieses Repository (`SCHandbuch`) hat den Stand von dort als `main` übernommen und wird über GitHub Pages veröffentlicht.

Branch: `redesign/v2`, abgezweigt von `main` bei `33dba81` (12.11.2026).
Veröffentlicht wird erst nach Freigabe durch Zusammenführen nach `main`. GitHub Pages liefert nur `main` aus, der Branch ist also nicht live.

## Regeln

- Kein Rewrite, keine neue Architektur: eine `index.html`, Hash-Routing, Datendateien bleiben.
- Nur Optik: CSS, Klassen und Markup-Struktur. Rechenlogik, Datenformate und Speicher-Schlüssel bleiben unverändert.
- Alle Anker (`#mining`, `#s-<slug>`, `#meine=…`, `#ccu-radar` usw.) bleiben gültig.

## Ausgangslage (gemessen)

| | |
|---|---|
| `index.html` | 553 KB, davon 69 KB CSS (815 Zeilen, rund 717 Regeln, 252 Klassen) |
| Ansichten | 29 `section.view` |
| Skriptblöcke | 21, erzeugen einen großen Teil des Markups zur Laufzeit |
| Farben | 23 CSS-Variablen; 9 feste Hex-Werte und 14 `rgba()` außerhalb von `:root` |
| Inline-Styles | 123 `style="…"` im Markup |
| Farbschema | folgt dem System (`prefers-color-scheme`), kein Umschalter |
| Dialoge | 2 (`<dialog>`: Schiffsdetail, 3D-Ansicht), 1 Canvas (three.js) |

## Betroffene Komponenten

1. **Design-Tokens** in `:root` (hell und dunkel, dreifach definiert). Hier setzt das Redesign an.
2. **Kopfzeile**: Logo, Tabs, zweite Reihe, Suche, Radar, News; eigenes Handy-Layout und Ausblenden beim Scrollen.
3. **Kasten-Arten**: `.tool`, `.card-plain`, `.hint`, `.oops`, `.learn`, `.fact`, `.chapter`, `.start-tip`, `.ccu`, `.bug`, `.wk`, `.sh`, `.plan-card`.
4. **Bedienelemente**: `.chip`, `.pill`, `.btn`, `.btn2`, `.check`, Eingabefelder, `kbd`.
5. **Tabellen** in `.table-wrap` (Mindestbreite 720 px, horizontal scrollbar).
6. **Per JS erzeugtes Markup**: Schiffskarten und -detail, Glossar, News, Bugs (offizielle Liste), Wikelo, Planer, CCU-Radar, Suche, HOSAS-Karten, Erz-Steckbrief.
7. **Grafiken**: HOSAS-Zeichnung (SVG, Farben `--st1` bis `--st5`), Tastatur, Executive-Hangar-Ampel, Logos mit Hell/Dunkel-Variante.

## Technische Risiken

1. **Zusammenführen mit `main`.** Bots schreiben mehrmals täglich `news.json`, `mining.json`, `ccu.json`, `pledge*.json` nach `main`. Diese Dateien auf dem Branch nicht anfassen, dann gibt es keine Konflikte. Änderungen an `index.html` auf `main` während des Redesigns würden kollidieren, also dort einfrieren oder zuerst nach `redesign/v2` holen.
2. **Markup aus JavaScript.** Klassen stehen in Zeichenketten in 21 Skriptblöcken. Umbenennen von Klassen bricht still. Darum: Klassen behalten und neu gestalten, nicht umbenennen.
3. **Logik hängt an Klassen und IDs.** Suche (`.row`, `.bug`, `.wk`, `h2/h3`), Filter (`[hidden]`, `aria-pressed`), Router (`[data-view]`, `aria-current`). Diese Haken bleiben.
4. **Glas-Effekte (`backdrop-filter`).** Bisher nicht im Einsatz. Auf langen Listen (Schiffe, Bugs, Wikelo) und schwächeren Handys kostet Unschärfe spürbar Leistung. Nur für wenige feste Flächen (Kopfzeile, Dialoge, Suche) einsetzen, Karten bekommen eine halbtransparente Fläche ohne Unschärfe. Rückfall für Browser ohne Unterstützung und für „weniger Transparenz“.
5. **Lesbarkeit.** Text auf transparenten Flächen verliert Kontrast. Ziel: mindestens 4,5:1 für Fließtext, in hellem und dunklem Schema geprüft.
6. **Helles Schema.** Die Seite hat beide Schemata. „Tactical Glass“ ist dunkel gedacht; entweder ein eigenes helles Gegenstück oder bewusst nur dunkel. Entscheidung nötig.
7. **Handy.** 360 px Breite ohne Querscrollen ist heute erfüllt (29 Ansichten geprüft). Jede Layoutänderung dort erneut messen.
8. **Inline-Styles.** 123 Stellen überschreiben CSS und fallen bei einem Token-Wechsel nicht automatisch mit um.
9. **Schriften** liegen lokal in `fonts/`. Keine externen Schriften oder Icon-Dienste nachladen (Datenschutz-Zusage im Footer).
10. **Druck und Bewegung.** `prefers-reduced-motion` und Druckregeln bleiben erhalten.

## Prüfung nach jedem Schritt

- Alle 29 Ansichten bei 360 px und Desktop: kein Querscrollen, keine Konsolenfehler.
- Funktionen: Suche, Planer, Meine Schiffe (Markieren, Filter, Link), Budget-Filter, Rechner (RS, Ruf, Recco, Frachter-Finder), Executive-Hangar-Timer, Häkchen bei „Erste Schritte“, 3D-Ansicht, CCU-Radar, News.
- Speicherstände: `sc-handbuch-steps`, `-ships`, `-plan`, `-patch`, `-ccu` und die übrigen Schlüssel bleiben lesbar.

## Stand Phase 2 (12.11.2026)

Umgesetzt: Designsystem „Tactical Glass“ (Tokens, Flächen, Bedienelemente, Hinweise, Tabellen, Kopfzeile) und die neue Startseite (Hero, Schnellzugriff, Werkzeuge, Wissensdatenbank, Aktuelles).

- Tokens stehen am Anfang des `<style>`-Blocks, die neuen Stile im Abschnitt „Tactical Glass: Oberfläche“ am Ende. Alte Regeln dazwischen sind unverändert und werden überschrieben.
- Alte Token-Namen (`--bg`, `--panel`, `--accent` …) sind Aliasse auf die neuen. Aufräumen der alten Regeln ist ein späterer Schritt.
- Unschärfe (`backdrop-filter`) nur an Kopfzeile, zweiter Reihe und Suche. `mask-image` im Hero wurde wieder entfernt, weil die Seite damit im Vorschau-Browser beim Scrollen leer blieb.
- Offen: Unterseiten einzeln durchgestalten, 123 Inline-Styles prüfen, helles Schema per Auge prüfen, alte CSS-Regeln zusammenführen.
