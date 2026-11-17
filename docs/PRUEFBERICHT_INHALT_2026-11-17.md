# Fachlicher Prüfbericht, 17. November 2026

Intern. Anlass: eine unabhängige Prüfung hatte Fehler und irreführende Aussagen gemeldet. Jede Beanstandung wurde gegen Quellen geprüft, bevor sie übernommen wurde. Spielstand: LIVE 4.10.3 (Build 13165946). PTU 5.0 wurde nicht verwendet.

## Quellen und ihre Rangfolge

1. **CIG-Patchnotes** (lokal in `patchnotes.json`, 4.10 bis 4.10.3 LIVE). Rang 1.
2. **Extrahierte Spieldaten über die Star Citizen Wiki API** (`api.star-citizen.wiki`, alle Datensätze mit `version` 4.10.3-LIVE.13165946): Missionen (1.832), Bauplänen (1.633), Fahrzeugen. Rang 2.
3. **Star Citizen Wiki** (starcitizen.tools, Seiten „Controls“, „Salvage“, „Refining“, „Medical bed“, „Primary Residence“, „Ship insurance“, „Recco Battaglia“) und **UEX** (Preise). Rang 3.
4. Community-Guides wurden nur dort stehen gelassen, wo kein höherer Rang etwas Gegenteiliges sagt, und sind im Seitentext als solche gekennzeichnet.

Zuverlässigkeit in den Tabellen: **hoch** = Patchnotes oder Spieldaten, **mittel** = Wiki-Seite, **gering** = Plausibilität ohne Beleg.

## Korrekturen

| # | Seite (Datei: `index.html`, Ansicht) | Bisher | Jetzt | Quelle, Version | Verlässlichkeit |
|---|---|---|---|---|---|
| 1 | Salvage, Tutorial Salvage, Berufe-Tabelle, Planer | „Bergungsaufträge kosten keine Gebühr“ | Adagio-Versorgungsaufträge kosten nichts. Ein „Salvage Rights“-Claim kostet 1.000, 5.000, 20.000 oder 50.000 aUEC je Schwierigkeit und lässt sich ohne Strafe abbrechen. | Wiki-API, Missionen `PU_SalvageContractor_Lawful_*` (`cost`), 4.10.3 | hoch. Eine Bindung der Stufen an einen Rang ist in den Daten nicht erkennbar und steht deshalb nicht im Text. |
| 2 | Salvage, Tabelle „Puffer leeren“ | Salvation 6, Vulture „13“, Fortune 16, ohne Unterscheidung | Fracht und Puffer getrennt: Salvation 6/8, Fortune 16/14, Vulture 12/16 SCU. Erklärung: Puffer (Hull munching capacity), Frachtkapazität, Rohmaterial der Strukturbergung. | CIG-Patchnotes 4.10.3 LIVE („Hull munching capacity …“) | hoch |
| 3 | Salvage | keine Aussage zur Strukturbergung | Für das Rohmaterial (Rubble, Pieces, Salvage) nennt weder CIG noch das Wiki eine Puffergröße. Das steht jetzt so da. | Wiki „Salvage“ (4.10.1) | mittel |
| 4 | Ruf-Rechner, Recco-Rechner | Zeichen außer Ziffern wurden gelöscht: „-150“ wurde 150, „1,5“ wurde 15, „2400,5“ wurde 24005 | Eigene Zahlenerkennung: negative Zahlen, Dezimalzahlen, Tausenderpunkt und Leerzeichen. Negativer Ruf zeigt „unter der ersten Stufe“, ungültige Eingaben eine Meldung. Im Browser mit zehn Eingaben getestet. | Fehler im eigenen Code | hoch |
| 5 | Ruf-Rechner | „Für Covalex und die Kopfgeldjäger-Gilde sind keine Zahlen bekannt“ | Leitern für Hauling-Firmen (Covalex, Red Wind, Ling) und Kopfgeldjäger-Gilde ergänzt (z. B. Experienced 27.750, Master 237.750, Guild Member 10.000, Guild Steward 480.000). InterSec, Foxwell und Adagio-Stufen stimmen mit den Daten überein. | Wiki-API, `min_standing` der Aufträge, 4.10.3 | hoch. Adagio nur bis Contractor belegt. |
| 6 | Ruf, Recco | Rang gleich Freischaltung | Hinweis, dass Rang und Ruf allein nicht reichen: Story 2 und 3 brauchen den vorigen Story-Auftrag, „Minor Mining Job“ erst nach Story 1. | Wiki-API, `prerequisite_groups` der Recco-Missionen | hoch |
| 7 | Recco | „Hinweis Golem“: eine Quelle nenne nur einen 25.000-aUEC-Auftrag | Beanstandung **nicht bestätigt**. Prestige 1 (10.800) schaltet „Extra Special Job“ frei und gibt die Golem Alliance, Prestige 2 (30.000) die Prospector Alliance, Prestige 3 (69.600) die MOLE Alliance. Alle Schwellen und Story-Belohnungen (Clearcut, Deluge, Overrun, GOLEM MC-4, MISC Enhanced Ore Pod) stimmen. | Wiki-API, Missionsdaten, 4.10.3 | hoch |
| 8 | Recco, Ruf je Auftrag | „Mining-Aufträge zum Einstieg bis 800“, „drei, vier Einstiegsaufträge bis Associate“ | 100 bis 300 Ruf je Auftrag bei Associate, 200 bis 600 bei Trusted Associate, Einstiegsaufträge 200. Bis Associate sind es nach Story 1 rund acht Aufträge. | Wiki-API, `reputation_gained`, 4.10.3 | hoch. Die Geldbeträge („um 40.000 aUEC“) stehen nicht in den Daten und bleiben als Angabe von scminer.rocks gekennzeichnet. |
| 9 | Überleben, Schiffs-Med-Betten | „kleine Betten nur 50 km, große im ganzen System“ | Stufen: 3 etwa 50 km, 2 etwa 8.000 km, 1 praktisch systemweit. Nicht jedes Schiff hat ein Bett. Ein Respawn kostet 1 SCU MedGel, das Bett fasst 2, 4 oder 6 SCU. | Wiki „Medical bed“ (4.10.3, Stub) | mittel. Weitere Voraussetzungen nennt das Wiki nicht. |
| 10 | Überleben, Sicherheitszonen; Erste Schritte | „Waffen und Schiffsgeschütze sind dort gesperrt“ | Strenge hängt vom Ort ab, kein Schutz vor Unfällen, Fehlern und anderen Spielern, Schäden an fremden Schiffen sind ein Verstoß. | Wiki „Salvage“ (Armistice Violation), Patchnotes (Schadensanzeige in der Zone) | gering. Eine Zuordnung „hart oder weich“ zu Orten ließ sich nicht belegen und steht deshalb nicht im Text. |
| 11 | Überleben, Versicherung | „im Moment dauerhaft versichert“ | Zusatz: laut Wiki seit 4.3.0, kann sich ändern. Die Aussage selbst ist bestätigt. | Wiki „Ship insurance“ (6. Okt. 2026) | mittel |
| 12 | Erste Schritte, Etappe 5 | Schiff nach dem Landen „im Hangar stehen lassen“ | Regulär am ASOP-Terminal einlagern. Stehen lassen nur bei einem Einlagerfehler (siehe Bugs). | CIG-Patchnotes 4.10.3 (Schiff auf dem Pad wird beim Verlassen eingelagert) | hoch |
| 13 | Erste Schritte, Etappe 1 | nur „I öffnet dein Inventar“ | Persönliches Inventar (Gepäck) und Assets-App (Schiffe, Fahrzeuge, Lager nach Ort) getrennt. | Bugliste der Seite („Assets-App“), keine eigene Quelle | gering bis mittel |
| 14 | Tasten (Zeile, Suche, Quiz, Glossar, Tastatur-Ansicht) | Gekoppelt/Entkoppelt = C, Tempomat = L-Alt + C | Gekoppelt/Entkoppelt = L-Alt + C, Tempomat = C | Wiki „Controls“ (Stand 13. Juli 2026, ohne Versionsangabe) | mittel |
| 15 | Tasten | Flight Ready, Autolandung, Helm ohne Hinweis | Als „prüfen“ markiert: Das Wiki nennt für Flight Ready nur R, für Autolandung „Strg halten“, für den Helm gar nichts (nur „Visier wischen“ L-Alt + X). | Wiki „Controls“ | gering. Wir können nicht entscheiden, was stimmt. |
| 16 | Heimatstädte | „Bugs gerade“, „kurze Wege“, „die längsten Wege“ | „Gemeldete Bugs“ mit Hinweis, dass wenige Meldungen keine höhere Zuverlässigkeit belegen. Wegangaben als Richtwerte. | Eigene Einordnung | n. a. |
| 17 | Heimatstädte | „vier Startorte“ (Startseite) | „Vier Heimatstädte in Stanton, dazu Orte in Nyx und Pyro.“ Die Seite nannte die vier Städte schon richtig. Auswahl, Wechsel beim ersten Login eines neuen Patches und Prämien-Lieferung an die Heimat sind bestätigt. | Wiki „Primary Residence“ (5. Okt. 2026) | mittel |
| 18 | Schiffe (Karten, Dialog, Tabellenzeile) | „Im Spiel nicht kaufbar (Pledge oder Belohnung)“ | „Kein aUEC-Preis bekannt“. Ein fehlender Preis heißt nicht, dass es das Schiff nur für Echtgeld gibt. | Wiki-API (Galaxy und Liberator sind spielbar und ohne Händler) | hoch |
| 19 | Hauling | „Frachtaufträge ohne Risiko“, „riskierst kein eigenes Geld“ | „fester Lohn“, ohne eigenen Geldeinsatz, aber nicht risikofrei: Absturz, Überfall, Ruf. | Bugliste der Seite, CIG Known Issues | mittel |
| 20 | Hauling, „Wann sich ein Kauf lohnt“ | „Kaufpreis geteilt durch deinen Verdienst pro Stunde“ (RAFT, 28 Stunden) | Einnahmen, Betriebskosten, Nettogewinn und der zusätzliche Gewinn gegenüber dem bisherigen Schiff getrennt. Rechenbeispiel mit ausdrücklich angenommenen Kosten (34 Stunden statt 28). | Rechnung | n. a. |
| 21 | Hauling, Gefahren | „Seit 4.10 überstehen Warenkisten künftige Patches“ | „Laut Patch Notes bleiben Waren im Lager erhalten. Für künftige Patches keine Garantie.“ | CIG-Patchnotes 4.10 bis 4.10.3 („LTP Preserved“) | hoch |
| 22 | Tagesplaner | Ohne Hangar-Angabe 4 SCU, bei „Frachter“ 64 SCU Fracht angenommen | Ohne Angabe wird keine Kapazität angenommen („Prüf zuerst im Frachter-Finder …“). „Frachter ab 64 SCU“ ist die Auswahl des Nutzers. Ertrags- und Erz-/Bergungsangaben als Richtwerte gekennzeichnet. | Eigener Code, im Browser getestet | hoch |
| 23 | Crafting | „Aslarit in 856 von 1.606 Material-Slots“ | Einheitenfehler: Das sind **Baupläne**, nicht Slots. 4.10.3: 872 von 1.633 Bauplänen (53 %). Slots gibt es insgesamt 4.285. Die Aufteilung nach Art blieb auf 4.10.2 und ist so beschriftet. | Wiki-API, `/blueprints` (1.633 Datensätze), 4.10.3 | hoch |
| 24 | Executive Hangar | „Live-Timer“, „dauerhaft behalten“, „ein Schiff, das dir bleibt“ | „Berechnet“, mit Hinweis, dass es keine Server-Abfrage ist. Das Schiff ist verdient, bei Wipe kann es verschwinden. | Beschreibung im Code (Startzeit + Zyklus), Wipe-Hinweis der Seite | hoch |
| 25 | Bugs | Wiedereinstieg nach Absturz „dann bist du noch am alten Ort“; Abbruch als Workaround ohne Warnung | Keine Garantie, Inventar und Fracht können fehlen. Hinweis auf möglichen Rufverlust bei Abbruch. | Eigene Einordnung (Quelle der Zeitangabe: Community) | mittel |
| 26 | Hauling, Frachter-Finder | Kistengrößen als gesichert | Hinweis auf Widerspruch zwischen unserer Berechnung (Gittermaße) und den Wiki-Daten 4.10.3 (Hull C, Hull B, RAFT, C1, Freelancer MAX, Zeus, Starlancer MAX, Taurus: 16 statt 32; Caterpillar, Star Runner: 32 statt keine). | Wiki-API `cargo_limits`, 4.10.3 | gering. Nicht aufgelöst. |
| 27 | Mining, RS-Rechner | nur die ersten vier Treffer, Mischvorkommen nicht erwähnt | Zeigt „x weitere Möglichkeiten“, weist auf Mischvorkommen hin, liest Zahlen wie „3.170“. | Eigene Einordnung | hoch |
| 28 | Mining, Erzwerte | „Basispreis“ ohne Marktvergleich | Hinweis auf die UEX-Verkaufspreise vom 17.11.2026 (z. B. Quantanium ~149.000, Lindinium ~48.000, Beryll ~19.900 aUEC/SCU), die teils deutlich abweichen. | UEX `/commodities` | mittel |
| 29 | Schiffsdaten (`ships.js`, `ships-detail.js`) | Galaxy und Liberator fehlten, 8 Preise fehlten, 14 Händlerlisten veraltet, MDC/MTC mit altem Preis | Ergänzt und abgeglichen (siehe Commits `bcf940c`, `ce152c1`). | Wiki-API und UEX, 4.10.3 | hoch |

## Beanstandungen, die sich nicht oder nur teilweise bestätigen ließen

- **Hard und Soft Armistice Zones unterscheiden:** Eine Quelle, die zeigt, welcher Ort welcher Art ist, haben wir nicht gefunden (Wiki hat keine eigene Seite, Patchnotes nennen es nicht). Der Text sagt deshalb nur, dass die Strenge vom Ort abhängt. **Nicht verifizierbar.**
- **Recco-Golem-Zweifel:** widerlegt (Korrektur 7).
- **Vier Startorte:** Die Heimatseite nannte die vier Stanton-Städte bereits richtig. Nur die Startseiten-Kachel war ungenau.
- **RMC-Preise und Wirtschaftlichkeit der Bergung:** nicht neu geprüft. Die Preise stammen von UEX, Stand 30. Oktober (4.10.2). Der Text zeigt das Datum.
- **Materialqualität, Verbrauch und Bauplanvoraussetzungen (Crafting):** nicht geprüft. Die Daten liegen in den Bauplänen (Zutatenmengen), wurden aber nicht mit den Seitentexten abgeglichen.
- **Erz-Signaturen, Fundorte, Schiffskapazitäten im Mining:** nicht geprüft. Die Signaturen stammen aus Community-Daten, eine Gegenquelle gibt es nicht. Die Raffinerie-Methoden (Dinyx, Ferron, Gaskin, Cormack, XCR, Kazen) stimmen mit dem Wiki überein (Geschwindigkeit, Kosten, Ausbeute). **Gebühren, Dauer und Transportweg einzelner Raffinerien nennt das Wiki nicht.**
- **Bugs und CIG-Bestätigung:** Die Bugliste trennt RSI-Known-Issues und Community-Berichte bereits. Der Abgleich mit den Fixes bis 4.10.3 stammt aus der Prüfung vom 12. November und wurde heute nicht wiederholt.

## Ansichten

Bewusst streng: **Eine Ansicht gilt nur als vollständig geprüft, wenn jede Aussage, Zahl und Taste gegen eine Quelle der Rangfolge belegt ist. Das trifft für keine Ansicht zu.** `content-status.json` wurde deshalb nur in den Begründungen (`reason`) dreier Seiten ergänzt, kein `patch` wurde angehoben.

| Ansicht | Einstufung | Was geprüft wurde |
|---|---|---|
| start, wissen, tools, berufe, einsaetze | nicht geprüft | Verteilerseiten, nur Verweise |
| erste-schritte | teilweise geprüft, korrigiert | Sperrzone, Einlagern, Inventar; Tasten nur teilweise gegen das Wiki |
| tutorial | nicht geprüft | |
| heimat | teilweise geprüft, korrigiert | Auswahlorte, Wechselregel, Formulierungen zu Wegen und Bugs |
| ueberleben | teilweise geprüft, korrigiert | Med-Betten, Versicherung, Sperrzonen |
| bugs | teilweise geprüft, korrigiert | Persistenz- und Abbruchhinweise. Liste nicht neu abgeglichen. |
| t-mining, mining | teilweise geprüft, korrigiert | Raffinerie-Methoden, RS-Rechner (Verhalten). Signaturen, Fundorte, Kapazitäten nicht. |
| t-salvage, salvage | teilweise geprüft, korrigiert | Puffer, Gebühren. RMC-Preise nicht neu. |
| t-hauling, hauling | teilweise geprüft, korrigiert | Aussagen zu Risiko, Persistenz, Rechenbeispiel. Löhne und Kistengrößen **nicht verifizierbar** (Widerspruch, Korrektur 26). |
| t-crafting, crafting | teilweise geprüft, korrigiert | Bauplanzahlen, Aslarit. Qualität und Verbrauch nicht. |
| recco | **vollständig geprüft für Ränge, Schwellen, Belohnungen, Ruf je Auftrag und Voraussetzungen** (Spieldaten 4.10.3). Beträge in aUEC, Wege und Bugs nur Community. | |
| ruf | teilweise geprüft, korrigiert | Rechnerfehler behoben, fünf Leitern gegen Spieldaten geprüft. Wikelo aus Community-Guides. |
| exec-hangar | teilweise geprüft, korrigiert | Aussagen zu Timer und Besitz. Karten, Türen und Platinen-Orte nicht. |
| vanduul, siege-orison, hathor, bunker | nicht geprüft | |
| tasten | teilweise geprüft, korrigiert | nur das, was das Wiki (Juli 2026) hergibt: etwa ein Viertel der Einträge |
| schiffe | geprüft für Preise, Händler, Fracht, korrigiert | Besatzung und Gewichte nicht übernommen (Wiki-Werte widersprüchlich). Bleibt Bernstein. |
| news, patchnotes, ccu-radar | nicht geprüft | automatisch erzeugte Daten |
| glossar, training, hosas | nicht geprüft | |

## Hinweise für die Pflege

- Die Wiki-API liefert mit `/missions`, `/blueprints` und `/vehicles` echte Spieldaten mit `version`. Für Ruf-Schwellen, Gebühren und Bauplan-Zahlen ist das die beste Quelle.
- Der Filter `filter[mission_type]` der Missions-Schnittstelle wirkt nicht. Immer alle 19 Seiten laden und selbst filtern.
- Das Wiki-Feld `max_scu_box` der Frachtgitter rechnet nach Volumen und passt nicht zu den langen 32-SCU-Kisten. Nicht ungeprüft übernehmen.
