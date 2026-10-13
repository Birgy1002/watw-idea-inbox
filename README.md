# WATW Idea Inbox · Version 1.3.1

Eine schlanke, **deutschsprachige**, offline nutzbare iPhone-Web-App für **Birgit und Thomas**. Die iPhone-Tastatur übernimmt das Diktieren. Notizen werden zunächst **ausschließlich lokal** gespeichert. Ein gemeinsames Google Sheet wird auf Knopfdruck über Google Apps Script beschrieben.

## Funktioniert bereits im App-Code

- Schreiben und **iOS-Tastaturdiktat** (kein eigener Mikrofon-Button).
- Autor einmal pro Gerät wählen, danach vorbelegt: Birgit oder Thomas.
- Bereiche: Quiz & Produkte, Guides & MAG, Marketing & Social Media, Website & Technik, Wein & Reisen, Business & Partnerschaften, Sonstiges.
- Titel optional, sonst aus dem ersten Satz automatisch abgeleitet.
- IndexedDB für Notizen, Wiederaufnahme eines unfertigen Entwurfs über localStorage.
- PWA / Service Worker für Offline-Nutzung **nach dem ersten Online-Öffnen**.
- Notizen nach offen, übertragen oder alle filtern, durchsuchen und nachträglich bearbeiten.
- Einzeln lokal löschen; für **nicht bestätigte Notizen** deutlich strengere Warnung.
- Alle im Sheet **bestätigten** Notizen mit „Aufräumen“ vom Gerät entfernen; Sheet-Einträge bleiben bestehen.
- JSON-Backups exportieren/importieren (ohne Verbindungsschlüssel).
- Ein gemeinsames Google Sheet mit den Blättern **Ideen** und **Übersicht**, automatisch in WATW-Bordeauxrot gestaltet: Filter, Dropdowns, farbige Status- und Prioritätsmarkierungen, KPI-Karten und Auswertungen nach Kategorie, Status und Autor. Status, Priorität, Zuständigkeit und nächste Schritte werden im Sheet gepflegt.
- Wiederholtes Senden aktualisiert dieselbe Zeile anhand der ID, statt sie zu duplizieren; vom Team bearbeitete Planungsfelder bleiben unangetastet.
- Eine Notiz gilt erst dann als **übertragen**, wenn eine lesbare Rückfrage ans Apps Script die gespeicherte ID und Revision bestätigt.

## 1. App auf GitHub Pages bereitstellen

Für die Idea Inbox bitte ein **neues Repository** verwenden, z. B. `watw-idea-inbox`.

1. Auf GitHub rechts oben **+ → New repository** anlegen (`watw-idea-inbox`, **Public** für kostenlose GitHub Pages im persönlichen Standardkonto).
2. Aus dieser ZIP **den Inhalt des Ordners** `watw-idea-inbox` in das Repository laden (nicht die ZIP selbst). `index.html` muss direkt im Repository-Hauptverzeichnis liegen, `icons/` als Unterordner.
3. **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
4. Die veröffentlichte URL wird ungefähr `https://birgy1002.github.io/watw-idea-inbox/` heißen. Den konkreten veröffentlichten Link im GitHub-Pages-Bereich ablesen.
5. Auf **jedem** iPhone den Link in Safari öffnen und über **Teilen → Zum Home-Bildschirm → Hinzufügen** als App ablegen.
6. In jeder installierten App einmal den richtigen Standardautor auswählen. Für den stabilen lokalen Speicher möglichst **immer über das Home-Bildschirm-Icon** öffnen. Die Safari-Registerkarte kann vom Speicher der installierten App getrennt sein.

**Achtung:** Das GitHub-Repository enthält **nur App-Code**. Es enthält keine Notizen, keinen geheimen Schlüssel, keine Google-Sheet-ID und keine persönliche URL. Die Seite selbst ist öffentlich erreichbar – der private Sheet-Zugriff ist durch einen langen Schlüssel geschützt. **Keine geheimen Daten oder Zugangsschlüssel in GitHub-Dateien eintragen.**

## 2. Ein gemeinsames Google Sheet einrichten

1. Ein **neues, leeres Google Sheet** erstellen, z. B. `WATW Ideas`. Thomas über den normalen **Freigeben**-Button als Bearbeiter hinzufügen.
2. Im Sheet: **Erweiterungen → Apps Script**. Den Editor-Inhalt durch die vollständige Datei `google-apps-script.gs` ersetzen. Speichern.
3. Im Apps-Script-Editor oben als Funktion **`setupIdeaInbox`** auswählen und einmal **Ausführen** anklicken. Beim ersten Mal die Google-Berechtigungsdialoge für das **eigene** Sheet bestätigen.
4. Im **Ausführungsprotokoll** erscheint beim ersten Ausführen der 64-stellige **private Schlüssel**. Den Schlüssel für die Einrichtung der beiden iPhones sicher aufbewahren. Bei weiteren Ausführungen steht er auch unter **Projekteinstellungen → Skripteigenschaften → `WATW_IDEA_INBOX_KEY`**.
5. Das Script **erstellt und gestaltet automatisch** das Blatt **Ideen** mit Kopfzeile, Filtern, Dropdowns, farbiger Statusanzeige und das Blatt **Übersicht** mit Kennzahl-Karten und automatisch berechneten Auswertungen. Ihr müsst **keine Formeln, Farben oder Formatierungen** selbst eintragen. Es bleiben gegebenenfalls ungenutzte Standardblätter bestehen, die ihr optional löschen könnt.
6. Die Zeitzone wird durch `setupIdeaInbox()` automatisch auf **Europe/Berlin** gesetzt. Das Übersichtsblatt steht anschließend vorne.

### Alternative: fertige Layoutvorlage ansehen

Die separate Datei `WATW_Idea_Inbox_Sheet_Vorlage.xlsx` ist eine **Ansichtsvorlage**, die sich in Excel öffnen oder in Google Drive hochladen und nach Google Sheets konvertieren lässt. Das Apps Script gestaltet aber auch ein ganz **leeres** Google Sheet identisch – der Import der Excel-Datei ist deshalb **nicht erforderlich**. Bitte **entweder** in einem leeren Google Sheet starten **oder** die konvertierte Vorlage verwenden, nicht beide Datenblätter doppelt anlegen.

## 3. Apps Script als Web-App bereitstellen

1. Im Apps-Script-Editor **Bereitstellen → Neue Bereitstellung**.
2. Typ **Web-App** wählen.
3. **Ausführen als:** Ich (Eigentümer des Scripts).
4. **Wer hat Zugriff:** Jeder (bei Google je nach Sprache „Anyone“). Die Web-App benötigt diesen nicht-interaktiven Zugang für den Browser-Aufruf; der lange private Schlüssel kontrolliert die eigentliche Berechtigung auf App-Ebene.
5. **Bereitstellen** und die Adresse mit Endung **`/exec`** kopieren.
6. Auf **beiden iPhones** in der WATW Idea Inbox über das Zahnradsymbol Einstellungen öffnen und **dieselbe `/exec`-Adresse und denselben privaten Schlüssel** eintragen. Birgit bzw. Thomas als Standardautor einstellen.
7. Speichern. Fertig für einen End-to-End-Test.

**Wichtig:** Die **Google-Drive-Verbindung in ChatGPT ist nicht erforderlich.** Diese App spricht Google Apps Script direkt an. Die geheime URL und der Schlüssel werden auf dem jeweiligen iPhone gespeichert, nicht in öffentlichen GitHub-Dateien.

## 4. Testablauf (am besten zunächst nur mit einer Testidee)

1. Auf Birgits iPhone eine Testnotiz schreiben (oder per iPhone-Tastatur diktieren) → „Idee speichern“.
2. Die Idee erscheint unter **Offen**. Die App schließen, wieder öffnen: Der Eintrag muss bleiben.
3. „1 übertragen“ antippen. Kurz danach muss die App **„… im Google Sheet bestätigt“** anzeigen. Sonst bleibt sie „Offen“ und kann später erneut übertragen werden.
4. In Google Sheets das Blatt **Ideen** öffnen; eine Zeile mit Autor Birgit muss sichtbar sein.
5. Die Zeile im Sheet in Spalte J auf „Prüfen“ und Spalte K auf „Hoch“ setzen. Die Notiz auf dem Handy bearbeiten und erneut übertragen: **dieselbe Sheet-Zeile** wird aktualisiert, J/K bleiben erhalten.
6. Auf dem Handy die bestätigte Idee löschen. Die Zeile muss im Sheet bestehen bleiben.
7. Mit einer **noch offenen** Notiz „Löschen“ testen: Die App muss ausdrücklich vor dem Verlust warnen.
8. Auf Thomas' iPhone dieselben Verbindungseinstellungen eintragen, Standardautor „Thomas“ wählen und eine eigene Testidee synchronisieren. Die beiden Ideen werden im **selben Sheet** angezeigt, die Handys zeigen weiterhin ihre **jeweiligen lokalen** Notizen.
9. Unter **Einstellungen → Backup exportieren** einen JSON-Export testen und sicher aufbewahren.

### Synchronisierung / Fehlerfälle

Ein cross-origin POST an Google Apps Script liefert der Browser-App keine auswertbare Antwort. Darum wird die Notiz nach dem Versand **nicht sofort grün markiert**. Stattdessen fragt sie über einen **schreibgeschützten JSONP-Endpunkt** ausschließlich die IDs und Versionsnummern der versendeten Notizen ab. Erst eine bestätigte Revision führt zum Status „Übertragen“. Die Abfrage enthält **keinen Notizinhalt**. Misslingt die Bestätigung (z. B. fehlende Netzwerkverbindung / Google-Fehler), bleibt die Notiz offen. Erneutes Übertragen ist sicher, da die Sheet-Logik **upsert** über ID/Revision durchführt.

Die Apps-Script-Web-App läuft mit den Berechtigungen des Google-Sheet-Eigentümers. Der private Schlüssel ist **eine Zugangsmöglichkeit**, kein Google-OAuth-Login. Wer den Schlüssel in Erfahrung bringt, könnte den Endpunkt missbrauchen. Deshalb: nicht auf GitHub stellen, nicht in Screenshots teilen, für keine anderen Dienste wiederverwenden. Der Schlüssel wird bei der Verifikationsabfrage als URL-Parameter an Google übertragen (kann in technischen Zugriffsprotokollen vorkommen). Google Sheets bleibt privat und wird mit Thomas separat geteilt.

Für **hoch vertrauliche Geschäftsinformationen** wäre später ein echtes Login-/Backend-Konzept vorzuziehen. Version 1 ist für interne WATW-Ideensammlung ausgelegt.

## 5. Einträge und Status im Sheet

| Spalte | Feld | Ursprung |
|---|---|---|
| A | ID | automatisch, eindeutig |
| B | Erfasst am | App |
| C | Aktualisiert am | App |
| D | Autor | Birgit / Thomas |
| E | Titel | App (automatisch oder selbst eingetragen) |
| F | Notiz | vollständiger Originaltext |
| G | Bereich | App |
| H | Revision | App / technischer Versionszähler |
| I | Importiert am | Google Apps Script |
| J | Status | **Im Sheet bearbeiten:** Inbox / Prüfen / Geplant / In Arbeit / Erledigt / Verworfen |
| K | Priorität | **Im Sheet bearbeiten:** Hoch / Mittel / Niedrig |
| L | Verantwortlich | **Im Sheet bearbeiten:** Birgit / Thomas / Beide |
| M | Nächster Schritt | **Im Sheet bearbeiten** |
| N | Zieldatum | **Im Sheet bearbeiten** |
| O | Stichworte | **Im Sheet bearbeiten** |

Beim nachträglichen Synchronisieren aktualisiert die App nur A–I. Sie überschreibt **nicht** die gemeinsam im Sheet gepflegten Bearbeitungsfelder J–O.

## 6. Einschränkungen dieser ersten Version

- Keine direkte bidirektionale Synchronisierung: **Auf den Handys werden nur die jeweils dort gespeicherten Ideen angezeigt.** Das gemeinsame Archiv ist Google Sheets.
- Die iOS-Diktierfunktion gehört zur **iPhone-Tastatur**, sie wird nicht selbst durch die App gesteuert.
- Google-Sheet-Übertragung benötigt Internet; Schreiben/Lesen der lokalen Notizen klappt offline, sobald die App mit Offline-Cache geladen wurde.
- Das Löschen einer Notiz vom Handy **löscht nichts aus Google Sheets**.
- Lokale Browserdaten können beim Entfernen einer App, bei Speicherbereinigung oder durch Gerätefehler verloren gehen. Deswegen regelmäßig ins Sheet übertragen oder Backup exportieren.
- Bis GitHub Pages und das eigene Google Sheet eingerichtet sind, wurde **kein realer End-to-End-Test mit euren Google-Zugängen** durchgeführt. Ein lokaler technischer Test ist kein Ersatz dafür.

## Dateien

- `index.html` – Grundstruktur
- `styles.css` – responsive iPhone-Oberfläche
- `app.js` – Notizen, Offline-Datenbank, Autor, Löschen, Backup, Sync
- `sw.js` – Offline-Cache
- `manifest.webmanifest` und `icons/` – iPhone-Installation
- `google-apps-script.gs` – Google-Sheet-Import, Sicherheitsprüfung, Verifikation, Dashboard


## Bedienung v1.2

- **Bereich** und **Erfasst von** werden als grosse, direkt anwählbare Tasten angezeigt, nicht mehr als Dropdowns.
- Der Name wird auf jedem iPhone nach der ersten Auswahl als Standardautor gespeichert. In den Einstellungen lässt sich der Standardautor ändern.
- Beim Bearbeiten einer alten Notiz wird der gerätespezifische Standardautor nicht verstellt.
- Die Kategorien werden weiterhin mit den gleichen Werten ins Sheet geschrieben, z. B. zeigt die Taste **Marketing & Social** den vollständigen Wert **Marketing & Social Media** im Export an.

## Update 1.3.1 – Logo und Cache

Die Glühbirne mit drei Notizstrichen ersetzt das W im Header sowie beide Homescreen-Icons (`icons/icon-192.png` und `icons/icon-512.png`). Die Datei `icons/idea-bulb-logo.png` wird im Header genutzt. Der Service Worker verwendet den Cache v1.3.1 und lädt bei Internetverbindung Ressourcen neu, statt dauerhaft alte Darstellungen auszuliefern. Bei einem bereits installierten iPhone-Homebildschirm-Icon kann iOS weiterhin das alte Icon zwischenspeichern; gegebenenfalls App vom Homebildschirm entfernen und neu hinzufügen.