# Versionsverwaltung (Patchstand)

Drei Dinge werden strikt getrennt. Eine neue Spielversion darf nie dazu führen, dass Inhalte als „aktuell“ erscheinen, die niemand durchgesehen hat.

| Was | Wo | Wer pflegt es |
|---|---|---|
| **LIVE-Version** und **Testversion** (PTU) | `version.json` | automatisch: `tools/fetch_patchnotes.py` (Workflow `patchnotes.yml`, alle 3 Stunden), abgeleitet aus `patchnotes.json` (RSI Comm-Link und Spectrum) |
| **Prüfstand einer Seite** | `content-status.json` | von Hand, nur nach einer echten Durchsicht der Seite |
| **Datenstand** automatisch geladener Daten | eigene Zeitstempel in `news.json`, `ccu.json`, `pledge.json`, `mining.json`, `patchnotes.json` | automatisch |

`version.js` liest `version.json` und `content-status.json`, vergleicht und zeichnet:

* je Seite die Kennzeichnung im Seitenkopf (`<span class="chead-tag vtag" data-vpage="<Ansicht>">`):
  * grüner Punkt: Prüfstand entspricht der LIVE-Version
  * bernsteinfarbener Punkt: Prüfstand liegt vor LIVE (Text nennt beide Versionen, Tooltip Grundlage und Hinweis)
  * gepunktet: kein Prüfstand erfasst
* Hubs (Berufe, Tutorials, Einsätze, Wissen) zeigen den **ältesten** Prüfstand ihrer Unterseiten.
* Platzhalter für die globale Version: `data-sc="live|live-label|live-date|test|test-label|live-test"`, `data-sc-if="test"`. Im HTML steht nirgends mehr eine feste LIVE-Nummer.
* den Hinweisbalken „Patch X ist live“: nur, wenn LIVE neuer ist als **jeder** eingetragene Prüfstand.

## Wenn ein neuer Patch erscheint

1. Der Workflow aktualisiert `patchnotes.json` und `version.json`. Alle Seiten zeigen automatisch „vor LIVE“, der Balken erscheint.
2. Nichts weiter ist nötig, damit die Anzeige stimmt.
3. Eine Seite durchsehen (Zahlen und Aussagen gegen Patch Notes und Quellen prüfen), dann in `content-status.json` `patch` und `date` dieser Seite anheben. Nicht den Seitenkopf bearbeiten.
4. Nie alle Einträge pauschal anheben. Genau das war bei der Anhebung auf 4.10.3 passiert (Commit `137960d`: Kopfzeilen auf 4.10.3, Inhalt unverändert). Die Einträge in `content-status.json` sind danach anhand des Seitentexts und der Git-Historie auf den tatsächlichen Stand zurückgesetzt worden (`basis`-Feld).

## Sonderfälle

* `schiffe`: `kind: "Datenstand"`. Die Schiffsdaten (`ships.js`) tragen die Spielversion im Kopfkommentar (zurzeit 4.10.2-LIVE.12881860). Beim Neuerzeugen der Daten den Eintrag mitziehen.
* Seiten ohne Eintrag (News, Patchnotes, CCU-Radar, Training, Werkzeuge, Start) sind versionsunabhängig oder zeigen ihre Daten mit eigenem Zeitstempel.
* `bunker`: kein Prüfstand angegeben, deshalb „nicht erfasst“.
* Aussagen im Fließtext, die ein Datum oder eine Version nennen („seit 4.10.3“, „Stand 30. Oktober 2026, Patch 4.10.2“), sind historische Angaben und bleiben stehen.
