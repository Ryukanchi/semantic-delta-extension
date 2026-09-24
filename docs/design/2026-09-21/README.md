# Semantic Delta · externe Designprüfung

## Status gegenüber der laufenden Extension

These files document the intended Semantic Delta review experience. The handoff
contains implemented, partially implemented, and future concepts. It must not
be interpreted as a representation of the current feature set. The running
extension and its tests remain the source of truth for implemented functionality.

| Status am 24. September 2026 | Beispiele |
| --- | --- |
| Implemented | getrennte Risk-/Confidence-Signale, No-Findings-Vorbehalt, Operational Error ohne Assessment, Analysis Limitations, Unified Text Diff, angezeigter Vergleichskontext und Review-Navigation |
| Partially implemented | Before/After-Vergleich und Kontextaufnahme vor der Analyse; die Desktop-Gesamtansicht des Prototyps ist nicht die aktuelle Extension-Oberfläche |
| Future/design-only | anklickbare Findings und SQL-Marker, Finding IDs, Source Spans, strukturierte Before/After-Finding-Werte, Split Diff, Edit SQL, Retry, Cancel, nachträgliches Context Editing, vollständige Report Preview und persistenter Review State |

Finding IDs, Source Spans und strukturierte Before/After-Finding-Werte benötigen
zusätzliche Daten im Detector-Vertrag. Die Screenshots zeigen Penpot-Konzepte,
keinen Lauf der VS-Code-Extension. `snapshot/Semantic Delta MVP 2026-09-21.penpot`
ist die native editierbare Designquelle; Inventar und Interaktions-Audit sind
abgeleitete Prüfunterlagen.

Stand: 21. September 2026. `index.html` öffnet die Galerie mit allen 17 vollständigen PNG-Ansichten. Die ersten acht decken die ausdrücklich angefragten Zustände ab. Produktansichten: 1600 × 1024 Pixel; Dialoge in ihrer nativen vollständigen Größe. Die Originaldateien lassen sich einzeln öffnen und vergrößern.

| Datei | Zustand |
|---|---|
| screenshots/01-entry.png | Einstieg / Startscreen |
| screenshots/02-sql-pair-ready.png | SQL-Paar vor dem Vergleich |
| screenshots/03-result-findings.png | Hauptergebnis mit Findings |
| screenshots/04-finding-detail.png | Detailansicht: Filter-Finding |
| screenshots/05-no-findings.png | Keine modellierten Findings |
| screenshots/06-partial-analysis.png | Partial Analysis und sichtbare Limitierung |
| screenshots/07-operational-error.png | Operational Error ohne Assessment |
| screenshots/08-risk-confidence.png | Risk-vs-Confidence-Erklärung |
| screenshots/09-file-selection.png | SQL-Dateipaar ausgewählt |
| screenshots/10-input-validation.png | Fehlende After-Eingabe |
| screenshots/11-analysis-running.png | Laufende Analyse |
| screenshots/12-context.png | Getrennter Kontext pro SQL-Eingabe |
| screenshots/13-limitation-detail.png | Limitierung und nächste Schritte |
| screenshots/14-partial-report.png | Bericht mit Analysegrenzen |
| screenshots/15-unified-detail.png | Unified-Ansicht mit Finding |
| screenshots/16-result-context.png | Ergebnis mit Kontext |
| screenshots/17-review-guide.png | Übersicht der Prüfszenarien |

## Grenzen des Prototyps

Vorgegebene SQL-Beispiele, Dateiauswahl und Kontextwerte; keine echte Texteingabe, Dateiübertragung oder SQL-Ausführung. Der Ladezustand schaltet nach 2,2 Sekunden zum Beispielergebnis. Berichte sind Vorschauen, keine implementierte Exportfunktion. Der sichtbare Tastaturhinweis ist eine Gestaltungsvorgabe, kein getesteter Shortcut. Die Datei zeigt eine Desktop-UX; responsives Verhalten und vollständige Tastatur-/Screenreader-Bedienung sind nicht implementiert oder geprüft.

## Prüfmaßstab

- Verständliche Trennung von SQL-Eingabe, Ergebnis und einzelner Evidenz.
- Risk beschreibt potenzielle Auswirkungen; Confidence beschreibt die Stärke der Evidenz.
- Keine Findings beweisen weder Sicherheit noch semantische Gleichheit.
- Partial Analysis und nicht modellierte Konstrukte bleiben auch im Bericht sichtbar.
- Operational Errors haben kein Risk-/Confidence-Ergebnis und einen klaren Wiederholungs-/Bearbeitungspfad.

Die native Sicherung liegt unter `snapshot/Semantic Delta MVP 2026-09-21.penpot`. `HANDOFF.md` dokumentiert den genauen Stand für die Fortsetzung. `snapshot/penpot-inventory.json` enthält IDs, Texte, Geometrie und Bibliothek; `snapshot/interaction-audit.json` enthält die geprüften Verknüpfungen. Der JSON-Bestand ist ein Inspektionsinventar, kein Ersatz für die native Sicherung.
