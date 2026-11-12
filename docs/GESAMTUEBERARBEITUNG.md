# SC HANDBUCH – Finale Gesamtüberarbeitung (Arbeitsauftrag und Stand)

Diese Datei hält den Auftrag und den Arbeitsstand fest, damit die Arbeit in jeder neuen Sitzung (auch von einem anderen Rechner) weitergeführt werden kann.
Zum Weitermachen einfach in einer neuen Claude-Code-Sitzung im Repo sagen: „Lies docs/GESAMTUEBERARBEITUNG.md und arbeite die offenen Phasen ab.“

Repository: Plexxy94/SCHandbuch · Live: https://plexxy94.github.io/SCHandbuch/
Das alte Repository SCfueRoony darf nicht verändert werden.

## Stand (laufend aktualisiert)

Fertig und live:
- Navigation in sechs Bereiche, Brotkrumen, Menü-Blatt (Phase 3 des früheren Redesigns)
- Startseite „mobiGlas Terminal B+“ inkl. „Schiff im Fokus“ (zufälliges 3D-Schiff im rechten Panel, `focus-pool.json`), weiche Hintergründe ohne harte Kanten
- Kapitelkopf mit Inhaltsverzeichnis nur bei: Erste Schritte, Mining, Tasten, Schiffe (plus Hubs Wissen und Werkzeuge)

## Arbeitsstand auf dem Branch `gesamt/ueberarbeitung` (NICHT auf main, noch nicht live)

Zum Weitermachen: `git fetch && git checkout gesamt/ueberarbeitung`, lokal testen (`python -m http.server 8765` im Projektordner), danach nach main mergen und die Live-Seite prüfen.

Auf dem Branch erledigt:
- Alle Unterseiten haben jetzt den Kapitelkopf (`.head.chead`), Einsätze als amberfarbene „Einsatzakte“, Inhaltsverzeichnis bei Seiten mit mindestens 3 Abschnitten.
- „Als Nächstes“-Leiste (`.nextup`, per Skript am Ende der Seiten) für Tutorials, Berufe und Einsätze.
- Komponentensystem global: Überschriften, Tabellen mit Scrollhinweis und Zebra, Chips, Hinweise, Datenkarten, Mindestschrift 12 px.
- Hellmodus: Farbtokens abgedunkelt (Cyan `#0B6074`, Amber `#8A4609`, Grün `#226339`) für Kontrast; Kontrast-Scan über alle 31 Ansichten bei 360/390/768/1440/1920 px in Hell und Dunkel ohne Befund (Ausnahme: dekorativer HUD-Text im Schiff-im-Fokus-Panel).
- Bugfixes: `.cr-bar i` färbte Fachbegriffe cyan, Überlauf der Startseite bei 360 px, Tasten-Karten bei 360 px, Navigationsleiste bei 1440 px.
- Tote CSS der alten Startseite entfernt (7,5 KB), CSS in `style.css` ausgelagert (index.html verweist per `<link>`).
- Automatisierte Prüfungen (per JavaScript im Vorschau-Browser): keine Konsolenfehler, alle internen Anker lösen auf, Deep-Links, Mining-Rechner, Schiffsuche, Schiff im Fokus, globale Suche, localStorage-Schlüssel unverändert.

Noch offen:
- Letzter Gesamtlauf nach der CSS-Auslagerung bei allen fünf Breiten und beiden Farbschemata, Konsole prüfen.
- Phase 4/5 Feinschliff der Werkzeuge: Rechner (RS, Fundort, Frachter-Finder, Ruf, Recco), Tagesplaner, Timer, Wikelo-Tabelle, CCU-Radar, News, Bugs als „Anwendungen“ optisch weiter angleichen; Hellmodus der Unterseiten per Auge prüfen (bisher nur per Kontrast-Scan).
- Phase 8: dezente Hover-Beleuchtung auf weiteren Panels, Ladezustände, Fokusmarkierungen auf Unterseiten prüfen.
- Screenshots der Unterseiten, Abschlussbericht, Veröffentlichung auf main und Live-Prüfung.

Früherer Stand (vor diesem Branch):
- Alle übrigen Unterseiten hatten noch den alten Kopf (`<div class="head"><div class="stamp">…`).

Geplantes Vorgehen (Entscheidungen, die schon getroffen sind):
1. Köpfe aller Unterseiten per Skript auf `.head.chead` umstellen (Kategorie „Bereich · Art“, Tags aus dem alten `.stamp`), `data-toc` bei Seiten mit mindestens 3 Abschnitten (`h2`, bei Tutorials `.step h3`).
2. Einsätze als „Einsatzakten“ (Kategorie in Amber), Tutorials mit „Als Nächstes“-Leiste (Reihenfolge: Heimatstadt → Erste Schritte → Überleben → Mining lernen → Salvage lernen → Hauling lernen → Crafting lernen → Training).
3. Komponenten global statt nur für einzelne Seiten: Überschriften, Data Panel (`.tool`, `.ore-card`, `.table-wrap`), Reading Panel (`.step`, `.panel`, `.card-plain`), Navigation Card (`.chapter`), Hinweise, Chips, Tabellen mit Scrollhinweis.
4. Tote CSS der alten Startseite entfernen (`.st-hero`, `.st-quick`, `.st-card`, `.start-search`, `.st-hud`), CSS in eine eigene Datei auslagern (rein mechanisch).
5. Tests: alle 31 Ansichten bei 360/390/768/1440/1920 px, Hell und Dunkel (Überlauf, Konsole, Kontrast-Scan), Deep-Links, Tools, localStorage-Schlüssel unverändert.

Wichtige technische Hinweise:
- Alle Änderungen in `index.html` per exakt passenden Ersetzungen (Skripte in Python), Klassen und IDs nie umbenennen, weil Skripte sie nutzen.
- Farbschema-Tokens stehen dreifach (hell, `prefers-color-scheme: dark`, `[data-theme=dark]`); neue Tokens an allen drei Stellen ergänzen.
- Das 3D-Schiff der Startseite und `focus-pool.json` müssen erhalten bleiben.
- Gespeicherte Daten (localStorage): `sc-handbuch-steps`, `-ships`, `-plan`, `-patch`, `-ccu` und weitere. Nie umbenennen oder löschen.
- Der Vorschau-Browser in der Claude-App liefert Screenshots unzuverlässig (Zeitüberschreitungen, teils ungeskalt); Messungen per JavaScript sind verlässlich.

## Der ursprüngliche Auftrag (wörtlich)

DU ÜBERNIMMST JETZT DIE FINALE GESAMTÜBERARBEITUNG VON SC HANDBUCH.

Projekt: https://github.com/Plexxy94/SCHandbuch
Live: https://plexxy94.github.io/SCHandbuch/

DESIGNRICHTUNG: "SC HANDBUCH – mobiGlas Terminal B+"

Das neue Design der Startseite ist unsere verbindliche visuelle Grundlage.

ZIEL: Die gesamte Website soll wie ein zusammenhängendes futuristisches mobiGlas-System aus dem Star-Citizen-Universum wirken. Sie soll hochwertig, atmosphärisch, übersichtlich, gut lesbar und vollständig responsiv sein. Die Benutzeroberfläche darf nicht wie eine gewöhnliche Dark-Mode-Website mit Cyan-Rahmen aussehen.

DESIGNPRINZIP: 70 % Funktionalität und Lesbarkeit. 30 % futuristische Star-Citizen-Atmosphäre.

WICHTIG: Arbeite selbstständig alle folgenden Phasen nacheinander ab. Triff sinnvolle gestalterische und technische Detailentscheidungen eigenständig. Stelle nur dann Rückfragen, wenn eine Entscheidung erhebliche Auswirkungen auf vorhandene Funktionen oder Nutzerdaten hätte. Alle bestehenden Daten, Inhalte, Werkzeuge und Funktionen müssen erhalten bleiben.

### PHASE 1 – BESTEHENDES DESIGN VEREINHEITLICHEN
Überprüfe das aktuelle mobiGlas-B+-Designsystem. Erstelle oder verbessere wiederverwendbare Komponenten für: Kapitelköpfe, Navigation Cards, Data Panels, Reading Panels, interaktive Werkzeuge, Formulare, Tabellen, Fortschrittsanzeigen, Statusmeldungen, Hinweise und Warnungen, Inhaltsverzeichnisse, Such- und Filterelemente.

Visuelle Vorgaben: mattes holografisches Glas; dunkle Graphit- und Blautöne; Cyan als primärer UI-Akzent; Amber für wichtige Highlights; technische Rahmen; abgeschrägte Ecken; feine Segmentlinien; dezente holografische Tiefe; weiche Hintergrundbeleuchtung; hochwertige Hover- und Fokuszustände.

Vermeide: unnötige Neon-Effekte; harte rechteckige Hintergrundkanten; überladene Oberflächen; winzige HUD-Texte; gleichförmige Kartenwüsten; zu viele ineinander verschachtelte Panels. Lange Lesetexte bleiben ruhig und reduziert.

### PHASE 2 – LERNEN UND TUTORIALS
Überarbeite vollständig: Tutorials-Übersicht, Heimatstadt wählen, Erste Schritte, Überleben, Mining lernen, Salvage lernen, Hauling lernen, Crafting lernen, Training.
Verbessere: Kapitelstruktur, Schritt-für-Schritt-Anleitungen, visuelle Orientierung, Fortschrittsanzeigen, Checklisten, Tipps und Warnhinweise, interne Verlinkungen, Inhaltsverzeichnisse.
Jeder Einsteiger soll sofort verstehen: Wo bin ich? Was muss ich tun? Was kommt danach?
Erhalte sämtliche bestehenden Fortschrittsdaten. Keine Inhalte löschen oder eigenmächtig verändern.

### PHASE 3 – WISSENSDATENBANK
Überarbeite: Berufe, Mining, Salvage, Hauling, Crafting, Ruf, Tastatur, HOSAS, Schiffe, Glossar.
Verbessere insbesondere: Informationshierarchie, Datenübersichten, Tabellen, Filter, Suchfunktionen, technische Datenblätter, Querverweise, mobile Darstellung. Die Datenbank soll schnell und angenehm nutzbar sein. Lange Kapitel erhalten klare Gliederungen und Sprungmarken. Keine Daten oder Berechnungsgrundlagen ändern.
SCHIFFSDATENBANK: Erhalte sämtliche bestehenden Schiffsdaten, Filter, Bilder und 3D-Modelle. Verbessere die Darstellung und Bedienbarkeit, ohne die bestehende Funktionalität zu beeinträchtigen.

### PHASE 4 – TOOLS UND RECHNER
Überarbeite alle bestehenden Werkzeuge: Mining-Rechner, Salvage-Werkzeuge, Hauling/Frachter-Finder, Ruf-Rechner, Tagesplaner, Schiffsdatenbank-Tools, CCU-Radar, Trainingsfunktionen, Missionstimer, Wikelo-Tauschliste, weitere vorhandene Werkzeuge.
Die Werkzeuge sollen wie eigenständige Anwendungen innerhalb des mobiGlas-Terminals aussehen. Gestalte: klare Eingabebereiche, verständliche Beschriftungen, hochwertige Ergebnisanzeigen, technische Datenpanels, gut erkennbare Statusinformationen, sinnvolle Hilfetexte, übersichtliche Filter, benutzerfreundliche mobile Layouts.
WICHTIG: Berechnungslogik unverändert lassen. Datenquellen nicht eigenmächtig ersetzen. Alle bestehenden Funktionen erhalten.

### PHASE 5 – EINSÄTZE UND AKTUELLES
Überarbeite: Einsatzanleitungen, Executive Hangar, Siege of Orison, Hathor, Bunker, weitere vorhandene Missionen, News, Serverstatus, Bugs & Workarounds, CCU-Radar.
Missionen sollen wie digitale Einsatzakten wirken. Verwende: übersichtliche Missionsphasen, wichtige Voraussetzungen, klare Warnhinweise, strukturierte Schrittfolgen, passende technische Info-Panels, gut sichtbare Timer und Statusanzeigen.
Keine nicht vorhandenen Live-Daten erfinden. Vorhandene APIs und Workflows erhalten.

### PHASE 6 – MOBILE OPTIMIERUNG
Optimiere für 360, 390, 768, 1440 und 1920 px. Besonders wichtig: gut bedienbare Navigation, ausreichend große Touchflächen, verständliche mobile Tabellen, keine horizontalen Seitenüberläufe, keine abgeschnittenen Inhalte, gut lesbare Schriftgrößen, sinnvolle Kartenraster, übersichtliche Formulare, stabile Bedienung der Rechner. Auf Smartphones dürfen dekorative HUD-Elemente reduziert werden. Funktionalität und Lesbarkeit haben Vorrang.

### PHASE 7 – DARK MODE UND LIGHT MODE
Prüfe und verbessere beide Farbschemata. Dark Mode: atmosphärisches mobiGlas-Terminal mit kontrollierter holografischer Beleuchtung. Light Mode: helles, hochwertiges technisches Interface mit ausreichenden Kontrasten. Keine unlesbaren Texte, keine zu hellen Glows, keine unsichtbaren Rahmen, keine schlecht erkennbaren aktiven Elemente. Prüfe insbesondere die Unterseiten, die bisher noch nicht vollständig im Hellmodus getestet wurden.

### PHASE 8 – ANIMATIONEN UND FEINSCHLIFF
Ergänze sparsam: elegante Hover-Effekte, dezente Panel-Illumination, subtile holografische Übergänge, hochwertige Ladezustände, konsistente Fokusmarkierungen. Alle Animationen performant, `prefers-reduced-motion` berücksichtigen, keine ablenkenden Dauereffekte, keine zusätzliche visuelle Unruhe.
Prüfe auch auf: harte Hintergrundkanten, ungleichmäßige Abstände, inkonsistente Rundungen, falsche Textgrößen, uneinheitliche Farben, unnötige Verschachtelungen.

### PHASE 9 – CODEQUALITÄT UND PERFORMANCE
Verbessere die Wartbarkeit, ohne die Anwendung unnötig neu aufzubauen: wiederverwendbare CSS-Komponenten, saubere Variablen, logisch strukturierte Dateien, unnötige CSS-Duplikate reduzieren, JavaScript nur dort optimieren wo sinnvoll, vorhandene Datenquellen weiterverwenden, externe Abhängigkeiten minimieren, Bilder und 3D-Ressourcen effizient laden, unnötige Layout-Verschiebungen vermeiden. Keine Migration zu einem neuen Framework ohne zwingenden Grund.
WICHTIG: Das bereits implementierte zufällige 3D-Schiff auf der Startseite muss vollständig erhalten bleiben.

### PHASE 10 – VOLLSTÄNDIGE QUALITÄTSKONTROLLE
Teste alle wichtigen Kapitel und Funktionen, insbesondere: Hauptnavigation, mobile Navigation, globale Suche, Deep-Links, Browser-Zurück-Navigation, Tutorials und Checklisten, gespeicherte Fortschritte, Tagesplaner, Mining-Rechner, Hauling/Frachter-Finder, Schiffsdatenbank, 3D-Schiffsmodelle, zufälliges Schiff auf der Startseite, CCU-Radar, News, Serverstatus, Missionstimer, HOSAS und Tastentraining, Dark/Light Mode.
Prüfe: Browser-Konsole, JavaScript-Fehler, fehlende Ressourcen, fehlerhafte Links, Layout-Überläufe, Tastaturbedienbarkeit, Fokuszustände, Kontraste, mobile Bedienung. Bestehende localStorage-Schlüssel und Datenformate dürfen nicht beschädigt werden. Falls möglich automatisierte Browser-Tests, repräsentative Screenshots.

### PHASE 11 – GIT UND VERÖFFENTLICHUNG
Arbeite ausschließlich am Repository Plexxy94/SCHandbuch. Das ursprüngliche Repository SCfueRoony darf NICHT verändert werden. Erstelle nach jeder abgeschlossenen Phase einen Commit. Vor dem Veröffentlichen: Syntax und Laufzeit prüfen, alle betroffenen Funktionen testen, Fehler beheben. Veröffentliche nach erfolgreichem Abschluss auf main von SCHandbuch. Prüfe anschließend die tatsächliche Live-Seite und dass alle Ressourcen korrekt laden.

### ABSCHLUSSBERICHT
Strukturierter Bericht mit: 1. allen überarbeiteten Bereichen, 2. neuen oder verbesserten Designkomponenten, 3. Änderungen an der Benutzerführung, 4. mobilen Optimierungen, 5. Performance-Verbesserungen, 6. Testergebnissen, 7. noch vorhandenen Einschränkungen, 8. Git-Commits, 9. Bestätigung des GitHub-Pages-Deployments. Dokumentiere ehrlich, welche Tests tatsächlich durchgeführt wurden. Erfinde keine Testergebnisse.

### ABSCHLIESSENDES ZIEL
SC HANDBUCH soll wie ein zusammenhängendes, professionelles mobiGlas-Terminal aussehen. Die Startseite dient als Launcher. Die Unterseiten wirken wie integrierte Anwendungen des Systems. Die gesamte Website muss atmosphärisch, modern, übersichtlich, gut lesbar, zuverlässig und vollständig responsiv sein. Priorisiere Qualität vor unnötigen Effekten. Arbeite die Aufgaben selbstständig und systematisch ab. Behebe Probleme, bevor du zur nächsten Phase übergehst. Stelle nur bei wirklich kritischen Entscheidungen Rückfragen. Nach Abschluss veröffentlichen und einen vollständigen Bericht liefern.

## Abschluss (2026-11-12)

Alle unter „Noch offen“ genannten Punkte sind abgearbeitet und auf main veröffentlicht:
- Gesamtlauf nach der CSS-Auslagerung: 31 Ansichten × 360/390/768/1440/1920 px × Hell/Dunkel, kein horizontaler Überlauf, keine Konsolenfehler. Restliche Schrift unter 12 px (Labels, Ruf-Leiter, HOSAS-Tags, Beta-Marke) auf 12 px angehoben.
- Werkzeuge nutzen das globale Komponentensystem (Datenpanels, Chips, Tabellen); dezente Panel-Beleuchtung, Fokusmarkierung für Eingabefelder und ein Ladezustand (`aria-busy`) ergänzt, alles mit `prefers-reduced-motion`-Ausnahme.
- Stichproben per Skript: Ruf-Rechner, Schiffsdeep-Link (`#s-drak-golem`), localStorage-Schlüssel unverändert, Schiff im Fokus vorhanden.

### Nachprüfung (2026-11-12)
Per Skript getestet, ohne Befund: Mining-RS-Rechner, Fundort-Filter, Frachter-Finder (inkl. Miete), Ruf-Rechner, Tagesplaner (Chips, localStorage `sc-handbuch-plan`), Tasten-, HOSAS- und Bug-Suche, Checkliste „Erste Schritte“ (`sc-handbuch-steps`, Zustand wiederhergestellt), Hangar-Timer, News und CCU-Radar laden Daten, Browser-Zurück, echte Tastaturfokus-Markierung (Tab), Kontrast-Scan Hellmodus (0 Befunde, Verläufe ausgenommen). Screenshots in `docs/screenshots`. Der Ladezustand `[aria-busy]` ist als CSS vorhanden, aber noch nicht an die Datenabrufe angebunden.

### Nachtrag (2026-11-12)
- Ladezustand (`aria-busy`) an CCU-Radar und Hangar-Timer angebunden.
- Fund: 64 von 225 gespeicherten 3D-Modell-Links (FleetYards) liefern 404, weil die Blob-Adressen ablaufen. Der 3D-Viewer holt jetzt bei einem Fehler einmal die aktuelle Adresse über `api.fleetyards.net/v1/models/<slug>` (Test: Ballista lädt). Die Daten in `ships.js` bleiben unverändert. `focus-pool.json` (136 Schiffe) ist vollständig erreichbar.
- Fund: Zahlenmarke in HOSAS hatte im Dunkelmodus Kontrast 1,68 (weiß auf Cyan), jetzt dunkle Schrift. Kontrast-Scan Dunkelmodus danach ohne weiteren Befund.
- Globale Suche, Training-Seite (Klicks, Regler) ohne Fehler getestet. `style.css` wird mit Versionsparameter geladen, damit Browser nach Änderungen nicht veraltetes CSS zeigen.
- 3D-Modell-Adressen in `ships.js` aufgefrischt (62 abgelaufene `glb`-Links über den FleetYards-Katalog ersetzt, danach 225 von 225 erreichbar; drei Fehlmeldungen waren Zeitüberschreitungen und beim Nachprüfen in Ordnung). Nur die Adressen wurden getauscht, keine anderen Schiffsdaten. Der Fallback im Viewer bleibt für künftig ablaufende Links. `ships.js` wird mit neuer Versionsnummer geladen.
- Tastentraining geprüft: richtige physische Taste wird erkannt (QWERTZ-Beschriftung), „halten“ wird eingefordert.
