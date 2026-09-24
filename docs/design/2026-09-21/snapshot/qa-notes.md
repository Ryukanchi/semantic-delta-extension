# Abschließende Prüfung · 21. September 2026

## Struktur und Gestaltung

- 35 obere Zeichenflächen, 2 Flows, 261 Interaktionen.
- Keine fehlenden Interaktionsziele.
- Alle Produktzustände und Dialoge ab Prüfübersicht erreichbar; Foundations absichtlich nicht.
- Penpot-Dateivalidierung: 0 Fehler.
- Textüberläufe: 0. Inhalte außerhalb der oberen Zeichenfläche: 0.
- 17 vollständige PNGs erstellt und visuell kontrolliert; Dateisignaturen und Abmessungen geprüft.
- Native Penpot-Sicherung: ZIP-Integrität fehlerfrei. Kein Wiederimport-Test.

## Tatsächlich im Viewer geprüfte Abläufe

- Einstieg → Beispiel → SQL-Paar → After leeren → Eingabehinweis → Beispiel laden.
- SQL-Paar → Compare → Ladezustand → automatischer Ergebniswechsel.
- Ergebnis → Edit SQL → Compare → Cancel → SQL-Paar bleibt erhalten.
- Main → Unified → Filter-Finding → Split; Auswahl erhalten.
- Bericht öffnen/schließen; Risk-/Confidence-Erklärung öffnen/schließen.
- Dateien: After zuerst → Before ergänzen; Before entfernen → After bleibt; After entfernen → leer.
- Dateien: Before zuerst → After ergänzen → Compare → Ergebnis.
- No Findings → Edit SQL → identisches Paar → Compare → No Findings; Bericht mit Gleichheits-/Sicherheitsvorbehalt.
- Partial Analysis → Limitierungsdialog → Bericht mit Limitierung → Edit SQL mit Fensterfunktion → Compare → Partial → Unified mit Warnung.
- Nach Korrektur: Klick auf Titel der Operational-Error-Prüfkarte → Fehleransicht → Retry → Loading → Ergebnis.
- Kontextdialog → Use example → Use this context → Kontext-Eingabe → Clear After → Kontext erhalten → Load example → Compare → Kontext-Ergebnis.
- Kontext-Ergebnis → Bericht mit Kontext → Filter-Finding → Unified; Kontext und ausgewähltes Finding erhalten.
- Alle übrigen Verknüpfungen anhand der gespeicherten Interaktionsziele geprüft. Es wurde nicht jede doppelte Variante jeder Schaltfläche einzeln per Maus getestet.

## Grenzen

Kein Test einer realen SQL-Analyse, echter Texteingabe, Dateiübertragung oder Berichtserzeugung. Keine vollständige Prüfung responsiver Ansichten, Screenreader- oder Tastaturbedienung. Tastaturhinweise sind Gestaltungsbestandteile.

Der Browser hing zeitweilig mit RESULT_CODE_HUNG. Die Datei wurde aus dem gespeicherten Stand neu geladen; danach wurden die letzten oben genannten Klicktests erfolgreich beendet. Der Hänger war kein nachgewiesener Fehler eines bestimmten Produkt-Links.
