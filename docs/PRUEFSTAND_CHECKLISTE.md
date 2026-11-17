# Wartungscheckliste: `content-status.json`

Intern. Beschreibt, wann und wie der Prüfstand einer Seite geändert wird. Die Anzeige erzeugt `version.js`, die globale LIVE-Version kommt automatisch aus `version.json`.

## Was die Anzeige bedeutet

| Anzeige im Seitenkopf | Zustand | Bedingung in der Datei |
|---|---|---|
| grüner Punkt, „Geprüft für 4.10.3“ | `ok` | `patch` ist gleich der LIVE-Version oder neuer |
| hohler grauer Punkt, „Geprüft für 4.10.2“ | `prior` | `patch` ist älter als LIVE, sonst nichts bekannt |
| bernsteinfarbener Punkt, „… · teils aktualisiert“ | `partial` | `"state": "teilweise"` und `reason` |
| roter Punkt, „Nachweislich veraltet“ | `outdated` | `"state": "veraltet"` und `reason` |
| gepunktet, „Prüfstand nicht erfasst“ | `unknown` | `patch` ist `null` |

**Eine noch nicht erneut geprüfte Seite ist nicht automatisch veraltet.** Eine neue LIVE-Version macht aus Grün automatisch Grau, aber nie Bernstein oder Rot. Bernstein und Rot setzt nur ein Mensch mit einer belegbaren Begründung.

Ein Klick auf die Kennzeichnung öffnet den Detailbereich mit Prüfversion, Prüfdatum, LIVE-Version, Einordnung, Hinweis und Grundlage.

## Felder je Seite

| Feld | Pflicht | Inhalt |
|---|---|---|
| `patch` | ja (oder `null`) | Spielversion, auf die sich Zahlen und Aussagen der Seite beziehen, z. B. `"4.10.2"` |
| `date` | nein | Tag der Durchsicht oder der Quelle, `JJJJ-MM-TT` oder `JJJJ-MM`, sonst `null` |
| `basis` | ja | Woher die Angabe stammt, in einem Satz, den Leser verstehen. Wird angezeigt. |
| `state` | nein | `"teilweise"` oder `"veraltet"` |
| `reason` | wenn `state` gesetzt | Belegbare Begründung. Wird angezeigt und muss auf der Seite selbst stehen oder in Patch Notes, Wiki, Quellen nachweisbar sein. |
| `kind` | nein | `"Datenstand"` statt „Geprüft für“ (z. B. Schiffe) |
| `intern` | nein | Interne Anmerkung, wird nicht angezeigt (Commit-Nummern, Herkunft) |

Hubs (`hubs`) haben nur `from`. Sie zeigen den ältesten Prüfstand ihrer Unterseiten und eine Zählung im Detailbereich, nie einen eigenen Prüfstand.

## Wenn ein neuer LIVE-Patch erscheint

1. Der Workflow `patchnotes.yml` aktualisiert `patchnotes.json` und `version.json` (alle 3 Stunden). Nichts in `content-status.json` ändern.
2. Alle Seiten zeigen jetzt automatisch Grau („Geprüft für <alte Version>“), der Hinweisbalken erscheint.
3. Patch Notes lesen (Seite „Patchnotes“). Notieren, welche Seiten betroffen sind: Preise, Ruf, Schiffe, Bugs, Tasten, Orte.
4. Betroffene Seiten zuerst durchsehen (Abschnitt unten). Unbetroffene Seiten bleiben grau, bis jemand sie wirklich geprüft hat.
5. Wurde nur ein Teil einer Seite aktualisiert: `patch` nicht anheben, stattdessen `"state": "teilweise"` und `reason` eintragen.
6. `python tools/check_content_status.py` ausführen, dann committen.

## Eine Seite durchsehen

- [ ] Alle Zahlen, Preise, Ränge, Orte, Tasten gegen Patch Notes und Quellen der Seite geprüft.
- [ ] Änderungen der neuen Version im Text vermerkt oder bewusst als „nicht betroffen“ eingeordnet.
- [ ] Quellenangaben und Stichtage im Seitentext aktualisiert (nicht nur der Kopf).
- [ ] Tabellen und Rechner der Seite mit den neuen Werten getestet.
- [ ] `patch` auf die geprüfte Version, `date` auf heute, `basis` neu formuliert.
- [ ] Ein vorhandenes `state` und `reason` entfernt, wenn die Abweichung behoben ist.
- [ ] Keine anderen Seiten mit angehoben.

## Wann Bernstein (`teilweise`)

- Die Seite enthält Werte aus verschiedenen Versionen, und das ist bekannt (z. B. Puffer neu, Preise alt).
- Eine konkrete Abweichung ist bekannt, aber noch nicht eingearbeitet (z. B. neue Schiffe fehlen in der Datenbank).
- Eine Aussage der Seite ist ungeprüft für die LIVE-Version und steht so auch im Text.

Nicht Bernstein: „wurde noch nicht erneut angesehen“. Das ist Grau.

## Wann Rot (`veraltet`)

Nur mit Nachweis, dass wesentliche Aussagen falsch sind: Patch Notes, die eine Zahl oder Mechanik ersetzen, eine entfernte Funktion, ein beendetes Event. `reason` nennt den Beleg. Ohne Beleg nicht Rot. Zurzeit ist keine Seite rot markiert, weil es dafür keinen Nachweis gibt.

## Nie tun

- Alle Einträge auf die neue Version anheben („Version anheben“). Genau das war beim Update auf 4.10.3 passiert (Commit `137960d`: nur die Kopfzeilen), die Einträge wurden danach anhand der Seitentexte korrigiert.
- Versionen oder Daten eintragen, die nicht belegt sind.
- Die Kopfzeile der Seite von Hand mit einer Version beschriften. Die Anzeige kommt ausschließlich aus dieser Datei.
- `version.json` von Hand ändern. Sie wird automatisch erzeugt.

## Prüfen

```bash
python tools/check_content_status.py
```

Das Skript prüft Format, Pflichtfelder, bekannte Seiten und Hubs, Zukunftsdaten und Widersprüche (z. B. `teilweise` ohne `reason`). Fehler beenden es mit Rückgabewert 1, Hinweise nicht.

Danach im Browser: eine grüne, eine graue und eine bernsteinfarbene Seite öffnen, den Detailbereich aufklappen, Hell und Dunkel ansehen.

## Zusätzliche Datenstände

- `schiffe`: `kind: "Datenstand"`, Version aus dem Kopf von `ships.js`. Beim Neuerzeugen der Schiffsdaten mitziehen.
- News, CCU, Patchnotes und Pledge-Daten zeigen eigene Zeitstempel und stehen nicht in dieser Datei.
