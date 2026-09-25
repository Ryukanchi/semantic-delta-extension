# Semantic Delta · vollständige Penpot-Übergabe

Historischer Design-Snapshot vom 21. September 2026. Der Implementierungsstand
der Extension ist in `README.md` abgegrenzt; Produktfunktionen lassen sich aus
diesem Prototyp allein nicht ableiten.

Stand: 21. September 2026. Dieser Snapshot dokumentiert die abgeschlossene MVP-Designarbeit und die externe Prüffassung. Er ist Kontext für einen neuen Chat; daraus folgt kein Auftrag zu weiteren Änderungen.

## Auftrag und Abschlussstand

Bestehende Semantic-Delta-UX in der verbundenen Penpot-Datei zu einem konsistenten, klickbaren Desktop-MVP weiterentwickeln. Visuelle Richtung und vorhandenen Flow erhalten. Anschließend Klickpfade, Informationshierarchie, Lesbarkeit und wichtige Zustände prüfen; nur tatsächlich gefundene Probleme korrigieren. Vollständige Screenshots und Übergabe liefern.

Ergebnis: 35 oberste Zeichenflächen einschließlich Produktvarianten, Dialogen, Prüfübersicht und Foundations. Zwei Flows, 14 lokale Komponenten, 24 Bibliotheksfarben und 8 Typografien. 261 registrierte Interaktionen; alle Ziele vorhanden. Alle Produktzustände und Dialoge von der Prüfübersicht erreichbar. Nur die absichtlich außerhalb des Prototyps liegenden Foundations sind nicht verlinkt. Penpot-Dateivalidierung: 0 Fehler. Geprüfte Textüberläufe und überstehende Inhalte: jeweils 0.

Die aktuelle Arbeit betrifft ausschließlich Penpot und das lokale Übergabepaket. Frühere CLI-, Release- und Repository-Aufträge aus dem langen Gespräch sind historischer Kontext und wurden nicht wieder aufgenommen. Keine Änderungen am semantischen Engine-Code, keine Commits, Pushes, Tags oder Veröffentlichungen. Repository-Status bei Abschluss: `## main...origin/main`, keine Arbeitsbaumänderungen.

## Verbindliche Produktregeln

1. Risk ist die Einschätzung potenzieller Auswirkungen. Confidence ist die Stärke der vorhandenen Evidenz. Beide bleiben getrennt, auch visuell.
2. Keine Findings beweisen weder semantische Gleichheit noch garantierte Sicherheit. Normale Reviews und Tests bleiben notwendig.
3. Partial Analysis, unvollständig modellierte Konstrukte und daraus folgende Unsicherheit bleiben sichtbar – auch in der Berichtsvorschau.
4. Operational Errors liefern kein semantisches Resultat. Risk und Confidence heißen dort „Not assessed“; es gibt keinen LOW-Risk-Erfolgszustand.
5. Die Beispiele führen keine SQL-Abfragen aus. Gelieferter Kontext ist nicht unabhängig verifiziert.

## Datei und Einstieg

- Datei: **Semantic Delta**
- Datei-ID: `c514c1fb-1cda-8125-8008-aa0218e6c9c9`
- Seite: **01 · Product direction**
- Seiten-ID: `c514c1fb-1cda-8125-8008-aa0218e6c9ca`
- Team-ID: `d8ac01df-6646-81d2-8008-a9fd98d1b636`
- Projekt-ID: `d8ac01df-6646-81d2-8008-a9fd98d1f0b5`
- [Editor](https://design.penpot.app/#/workspace?team-id=d8ac01df-6646-81d2-8008-a9fd98d1b636&project-id=d8ac01df-6646-81d2-8008-a9fd98d1f0b5&file-id=c514c1fb-1cda-8125-8008-aa0218e6c9c9&page-id=c514c1fb-1cda-8125-8008-aa0218e6c9ca)
- [Klickbarer Prototyp / Prüfübersicht](https://design.penpot.app/#/view?file-id=c514c1fb-1cda-8125-8008-aa0218e6c9c9&page-id=c514c1fb-1cda-8125-8008-aa0218e6c9ca&section=interactions&frame-id=8d7fa7fa-c52b-802e-8008-ab34bb0f65d0&zoom=fit)
- Flow **MVP review · all states** startet bei der Prüfübersicht.
- Flow **Product · new SQL comparison** startet beim leeren Einstieg.
- Dialoge und Foundations sind nicht als eigenständige Viewer-Seiten eingeblendet; Dialoge öffnen sich über Overlays.

Keine neuen Freigaben oder öffentlichen Links wurden erzeugt. Die vorhandenen Links nutzen bestehende Zugriffsrechte.

## Lokale Übergabe

Ordner in diesem Repository: `docs/design/2026-09-21/`

- `index.html`: lokale Galerie mit 17 beschrifteten Bildern und Links auf Original-PNGs.
- `README.md`: Zuordnung der Screenshots und Hinweise für die externe Prüfung.
- `screenshots/`: vollständige native Ansichten, ohne Browserleisten. Produktframes 1600 × 1024; Dialoge in nativer Größe; Prüfübersicht 1600 × 804.
- `snapshot/Semantic Delta MVP 2026-09-21.penpot`: vollständiger nativer Penpot-Download, 9.360.447 Bytes. ZIP-Integrität geprüft, 3.289 Archiveinträge. Es wurde kein Wiederimport in eine andere Datei vorgenommen.
- `snapshot/penpot-inventory.json`: Bildschirm-/Shape-IDs, Texte, Geometrie, Füllungen, Rahmen, Typografie, Komponenten und Flows. Inspektionsinventar; für vollständige Wiederherstellung die native Sicherung verwenden.
- `snapshot/interaction-audit.json`: alle Interaktionen mit Quelle, Ziel, Auslöser und Verzögerung; Geometrie- und Validierungsergebnis.
- `snapshot/qa-notes.md`: tatsächlich geprüfte Pfade und Grenzen.
- `checksums.sha256`: Prüfsummen für die Dateien des Pakets.
- Ein zusätzliches Gesamt-ZIP ist nicht Teil dieses Repository-Handoffs.

Der ältere Ordner `design-review-2026-09-20` enthält nur vorläufige Exportreste und ist **nicht** die aktuelle Prüffassung.

## Visuelle Richtung

Ruhige Entwickler-Werkbank mit zwei SQL-Eingaben, anschließend SQL-Evidenz links und semantischem Review rechts. Kein Navigationsapparat eines generischen SaaS-Dashboards. Viel klare Fläche; Farbe trägt eine konkrete Bedeutung.

- Canvas `#F4F5F0`, Paper `#FFFFFF`, Text `#203238`, Sekundärtext `#607075`, Linien `#DCE2DB`.
- Primäraktion / Links `#126A60`, weiche Auswahlfläche `#E8F3EE`, Evidenzmarkierung `#D4EEA0`.
- SQL-Editor `#17242A`, Kopf `#1F3036`, Editorlinien `#34464E`, Code `#D9E3E5`, Metadaten `#93A7AE`.
- Keywords `#ADBEF1`, Literale `#C9DFA3`.
- Risiko/Limitierung: `#87530A` auf `#FFF2D8`.
- Operational Error: `#9A3939` auf `#FCEDEC`.
- Entfernte/ergänzte SQL-Zeilen: gedämpftes Rot/Grün, zusätzlich Minus-/Pluszeichen.
- IBM Plex Sans für UI, IBM Plex Mono für SQL und Metadaten.
- Produkttexte Englisch; Kommunikation und Übergabe Deutsch.
- Komponenten bleiben native, editierbare Penpot-Elemente.

## Inhalt und Interaktionen

### Hauptablauf

Einstieg → „Try an example“ → zwei gefüllte SQL-Eingaben → „Compare SQL“ → Ladezustand → Findings. Der Ladezustand navigiert nach 2.200 ms zum Beispielergebnis. „Cancel analysis“ kehrt zu den erhaltenen SQL-Eingaben zurück. „Edit SQL“ öffnet die passende Eingabevariante. „New comparison“ führt zum Einstieg.

Das Hauptbeispiel ändert LEFT JOIN zu INNER JOIN und ergänzt `o.total >= 100`. Das Review zeigt zwei Findings. Join- und Filter-Finding lassen sich über Karten und nummerierte SQL-Marker auswählen. Split und Unified erhalten die Auswahl. Unified zeigt Originalzeilen als **before / after**; entfernte/ergänzte Zeilen nutzen einen Strich für die jeweils fehlende Seite.

### Kein Finding

Beide SQL-Beispiele sind identisch. Anzeige: Risk low, Confidence medium, „No modeled differences detected“. Expliziter Hinweis: kein Beweis semantischer Gleichheit, keine Sicherheitsgarantie. „Edit SQL“ öffnet genau dieses Paar; erneutes Vergleichen kehrt zu diesem Zustand zurück. Bericht und Unified-Ansicht bewahren den Vorbehalt.

### Partial Analysis

Before ist modelliert, After enthält `SUM(...) OVER (PARTITION BY ...)`. Join-Finding plus Fensterfunktions-Limitierung; Risk high, Confidence low. Oberes Warnband, Abdeckung pro Eingabe, Einschränkungskarte und zusätzliche Hinweise machen die Unvollständigkeit sichtbar. Detaildialog erklärt ungeklärte Gruppierungs-/Zeilenzahl-Effekte und die manuelle Prüfung. Weitere Änderungen können unberichtet bleiben. Bericht, Unified und Edit-/Compare-Rückweg erhalten diese Aussage.

### Operational Error

Timeout ohne semantisches Ergebnis. Risk und Confidence: „Not assessed“. Diagnose `ANALYSIS_TIMEOUT`, SQL bleibt erhalten, „Retry analysis“ und „Edit SQL“. Bericht deaktiviert als „No report“. Retry läuft über den Ladezustand zum Beispielergebnis.

### Eingabe und Dateien

Leere Eingabe: Vergleich deaktiviert. „Clear“ für After erzeugt eine inline markierte fehlende Eingabe; Before bleibt erhalten. „Load example“ stellt das Beispiel wieder her. Leere Eingabeflächen füllen sich nicht durch einen bloßen Klick automatisch.

Dateiflow: leer → Before zuerst oder After zuerst → beide Dateien → Vergleich. „Remove file“ entfernt nur die jeweilige Auswahl. Ausgewählte Beispieldateien sind `revenue.before.sql` (8 Zeilen) und `revenue.after.sql` (9 Zeilen).

### Kontext

Dialog mit getrenntem Metric name / Intended use für Before und After. Optionaler SQL-only-Rückweg. „Use example“ lädt vorgegebene Werte; „Use this context“ öffnet das SQL-Paar mit Kontext.

Vorher: paid revenue einschließlich nicht zuordenbarer Orders. Nachher: qualified revenue mit passendem Customer und Order-Wert mindestens 100. Ergebnis: „Paid vs qualified revenue“, Evidenz „SQL + intended use“. Kontext liefert keine automatische hohe Confidence und bestätigt keinen tatsächlichen Geschäftseffekt.

Kontext bleibt bei Finding-Auswahl, Split/Unified und im Bericht erhalten. Nach „Clear“ für After bleibt er in einer eigenen Validierungsvariante erhalten; „Load example“ führt zur Kontext-Eingabe zurück.

### Erklärungen und Berichte

Risk-/Confidence-Dialog erläutert Auswirkung gegenüber Evidenzstärke allgemein. Hoher Risk kann mit niedriger Confidence auftreten. SQL ist Primärevidenz, Kontext optional, Ausführung findet nicht statt.

„View report“ öffnet eine Vorschau für Findings, No Findings, Partial Analysis oder Kontext. Keine vorgetäuschte Downloadfunktion. „Back to review“ schließt die Vorschau. Einschränkungen werden mitgeführt.

### Prüfübersicht

12 Szenariokarten außerhalb der Produkt-UI. Titel, Nummern und Beschreibungen sind ebenfalls anklickbar. Sie erklärt ausdrücklich die geskripteten Beispiele. Über die Penpot-Flow-/Zeichenflächen-Auswahl gelangt man zurück.

## Korrekturen aus der Schlussprüfung

- Fünf zu schmale Textfelder im Kontext-Flow verbreitert.
- Falsche Beispielhinweise bei identischen SQL-Eingaben und Fensterfunktion korrigiert.
- Unified-Zeilennummern auf Originalzeilen before / after umgestellt; widersprüchlichen Marker-Hinweis entfernt.
- Klickflächen der Prüfkarten auf Nummern, Titel und Beschreibungen erweitert.
- Kontextverlust beim Leeren von After durch die zusätzliche Validierungsvariante behoben.
- Keine semantische Engine- oder API-Änderung und keine neue Produktfunktion in der Schlussrunde.

## Grenzen und offene Produktarbeit

Dieser MVP ist ein **klickbarer Designprototyp**, keine implementierte Anwendung. Textfelder, Dateiauswahl, Analyse und Berichte verwenden feste Beispiele. Es gibt keinen echten Dateidialog, Parser-/Worker-Aufruf, Copy-/Download-Mechanismus oder persistierenden Vergleichsspeicher. Der Tastaturhinweis ist visuell; Shortcut-Verhalten wurde nicht implementiert oder verifiziert. Responsive Layouts, vollständige Tastatur-/Screenreader-Bedienung und weitere Fehlertypen sind nicht ausgearbeitet.

Keine pauschale Behauptung vollständiger Barrierefreiheit oder der Funktionsfähigkeit eines realen Analyse-Backends. Die Szenarien dienen zur UX-Prüfung und müssen bei einer späteren Implementierung gegen die tatsächlichen öffentlichen Produktverträge validiert werden.

Die nächste sinnvolle Arbeit ist die externe Prüfung dieser Fassung und anschließend eine gezielte Umsetzung konkreten Feedbacks. Nicht erneut bei null beginnen oder die abgeschlossene Release-/CLI-Arbeit aus früheren Nachrichten aufgreifen.

## Bildschirmregister

| Schlüssel | Penpot-Name | ID |
|---|---|---|
| main | 01 · Compare SQL — semantic review | `5b3edfae-0ec7-80cd-8008-aa045cdd1877` |
| resultContext | 21 · Result — context supplied | `8d7fa7fa-c52b-802e-8008-ab33c4c12bbe` |
| unifiedContext | 21c · Context review — unified | `8d7fa7fa-c52b-802e-8008-ab344a323ac7` |
| unified | 15 · Review — unified SQL view | `8d7fa7fa-c52b-802e-8008-ab3303ac530d` |
| error | 09 · Operational error — no result | `8d7fa7fa-c52b-802e-8008-ab325f47fa0c` |
| partial | 08 · Result — partial analysis | `8d7fa7fa-c52b-802e-8008-ab3219d6f13b` |
| unifiedPartial | 15d · Unified — partial analysis | `8d7fa7fa-c52b-802e-8008-ab3441e0808e` |
| noFindings | 07 · Result — no findings | `8d7fa7fa-c52b-802e-8008-ab32151b87b6` |
| unifiedNone | 15c · Unified — no findings | `8d7fa7fa-c52b-802e-8008-ab343eb81c56` |
| filter | 04 · Semantic review — filter selected | `d2967f2c-f73f-8086-8008-aa3f2458d22a` |
| filterContext | 21b · Context review — filter detail | `8d7fa7fa-c52b-802e-8008-ab3448863040` |
| unifiedFilterContext | 21d · Context review — unified filter | `8d7fa7fa-c52b-802e-8008-ab34503f6c6b` |
| unifiedFilter | 15b · Unified — filter detail | `8d7fa7fa-c52b-802e-8008-ab343aabc02c` |
| entry | 02 · New comparison — entry | `5b3edfae-0ec7-80cd-8008-aa05448eb8e7` |
| files | 12 · File input — empty pair | `8d7fa7fa-c52b-802e-8008-ab3300b2bc84` |
| fileAfter | 13b · File input — after selected | `8d7fa7fa-c52b-802e-8008-ab33683c5416` |
| fileOne | 13 · File input — baseline selected | `8d7fa7fa-c52b-802e-8008-ab330238c0b2` |
| fileReady | 14 · File input — ready | `8d7fa7fa-c52b-802e-8008-ab3302a6c432` |
| ready | 03 · SQL pair — ready to compare | `d2967f2c-f73f-8086-8008-aa3f22589882` |
| readyContext | 20 · SQL pair — context supplied | `8d7fa7fa-c52b-802e-8008-ab33c4255d0f` |
| readyPartial | 18 · SQL pair — window example | `8d7fa7fa-c52b-802e-8008-ab336c90f8b2` |
| readyNone | 17 · SQL pair — no-findings example | `8d7fa7fa-c52b-802e-8008-ab336a6558eb` |
| invalid | 11 · Input validation — missing query | `8d7fa7fa-c52b-802e-8008-ab3262e21c19` |
| loading | 10 · Comparing — in progress | `8d7fa7fa-c52b-802e-8008-ab32617e1564` |
| foundations | 90 · Foundations — visual language | `5b3edfae-0ec7-80cd-8008-aa0621dd317d` |
| context | 05 · Context — per-query dialog | `d2967f2c-f73f-8086-8008-aa3f6e90971c` |
| contextFilled | 19 · Context — example values | `8d7fa7fa-c52b-802e-8008-ab33c34c77fd` |
| assessment | 06 · Assessment — risk and confidence | `d2967f2c-f73f-8086-8008-aa3f933cd1ee` |
| limitation | 16 · Analysis limitation — detail | `8d7fa7fa-c52b-802e-8008-ab33696081ba` |
| reportMain | 22 · Report — findings | `8d7fa7fa-c52b-802e-8008-ab33c5d6cf59` |
| reportNone | 23 · Report — no findings | `8d7fa7fa-c52b-802e-8008-ab33c6d4c88e` |
| reportPartial | 24 · Report — partial analysis | `8d7fa7fa-c52b-802e-8008-ab33c7e1d943` |
| reportContext | 25 · Report — with context | `8d7fa7fa-c52b-802e-8008-ab33c90177b8` |
| guide | 00 · MVP prototype — review guide | `8d7fa7fa-c52b-802e-8008-ab34bb0f65d0` |
| invalidContext | 11b · Input validation — context preserved | `8c4682f0-cb03-806c-8008-ac8cb1b569ff` |

## Hinweise für einen neuen Codex-Chat

1. Diese Übergabe und die Galerie lesen. Die Nutzerentscheidung für weitere Arbeit erfragen bzw. den neuen konkreten Auftrag beachten; der Snapshot allein ist kein Änderungsauftrag.
2. Aktuellen verbundenen Datei-/Seitenstand live gegen die IDs prüfen. Daten können nach diesem Snapshot geändert worden sein.
3. Für Penpot die vorhandenen MCP-Werkzeuge verwenden; Figma ist hier nicht das Zielsystem. Vor erstmaliger Toolverwendung die erforderliche Penpot-API-Dokumentation lesen.
4. `storage` in Penpot und lokale Tool-Zwischenspeicher können nach Reload oder neuem Chat leer sein. Keine alten Helper-Funktionen als vorhanden voraussetzen. Shapes anhand der IDs aus dem Inventar neu auflösen.
5. Suchen nach Shapes auf die jeweilige Zeichenfläche begrenzen. Bibliotheksmaster erhalten. Der native **Delta mark**-Master liegt auf **90 · Foundations — visual language**; nicht löschen oder dort Header-Rebuilds ausführen.
6. Nach Änderungen Typografie, Grenzen und Verknüpfungen prüfen, dann vollständige native Ansichten visuell kontrollieren. Neue Exporte vor Übergabe tatsächlich öffnen; nicht nur Tool-Erfolg als Nachweis verwenden.
7. MCP kann bei Hintergrund-Tabs eine fehlende Heartbeat-Verbindung melden. Den tatsächlichen Editor-Tab aktivieren. Bei einem echten Browser-Hänger zuerst Sicherung/gespeicherten Stand prüfen. In dieser Sitzung meldete Brave `RESULT_CODE_HUNG`; Schließen der nicht reagierenden Seite und frisches Laden stellte die Verbindung wieder her. Die anschließenden Klicktests waren erfolgreich.
8. Native Viewer-Links können alten Zustand behalten; bei Bedarf frische Vorschau aus der gespeicherten Datei öffnen. Zoom im Viewer auf „Anpassen“ stellen.
9. Keine Quellcode- oder Repository-Änderung aus diesem reinen Designauftrag ableiten. Keine Veröffentlichung, Freigabeänderung oder neue Task-Erstellung vornehmen, sofern nicht neu beauftragt.

Der native Download wurde nach allen Designkorrekturen erzeugt. Anschließend erfolgten nur Prüfungen und Exporte. Die Prüfübersicht ist zum Abschluss im Editor ausgewählt.
