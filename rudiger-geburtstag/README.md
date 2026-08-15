# Rüdiger wird 61 🥂 — Foto- & Gästebuch im Art-Deco-Stil

Eine statische Webseite im Stil der Goldenen Zwanziger (Great-Gatsby-Look) als
Foto- und Gästebuch für Rüdigers 61. Geburtstag am **15. August 2026** in
**Bielefeld-Schildesche**.

## Funktionen

- 🔒 Einfacher Passwortschutz (nur für geladene Gäste)
- 🎉 Begrüßungs-Popup mit Foto von Rüdiger
- ✍️ Gästebuch — jeder Gast kann einen Gruß hinterlassen (live sichtbar für alle)
- 📸 Foto-Upload — jeder Gast mit dem Link kann Fotos hochladen, alle sehen die gemeinsame Galerie
- 🍋 Menü-Übersicht (Tagsüber & Abendessen)

Die Seite ist **komplett statisch** (reines HTML/CSS/JS, kein Build-Prozess
nötig) und lässt sich direkt mit **GitHub Pages** hosten. Damit Grüße und
Fotos für *alle* Besucher sichtbar gespeichert werden, nutzt sie im
Hintergrund ein kostenloses **Firebase**-Projekt (Firestore + Storage).

---

## 1. Firebase-Projekt einrichten (einmalig, ca. 10 Minuten)

1. Gehe zu [console.firebase.google.com](https://console.firebase.google.com/)
   und melde dich mit einem Google-Konto an.
2. **Projekt erstellen** → beliebigen Namen vergeben, z. B. `ruedigers-birthday`.
   Google Analytics kannst du deaktivieren, wird nicht gebraucht.
3. Im Projekt links auf **Build → Firestore Database** → **Datenbank erstellen**.
   - Standort z. B. `eur3 (europe-west)` wählen.
   - Modus: **Testmodus** (wir setzen die Regeln unten manuell).
4. Links auf **Build → Storage** → **Los geht's** → gleichen Standort wählen.
5. Links oben auf das Zahnrad ⚙️ → **Projekteinstellungen** → runterscrollen zu
   **Meine Apps** → auf das Symbol **`</>`** (Web-App hinzufügen) klicken.
   - App-Spitzname z. B. `ruediger-geburtstag`, **kein** Firebase Hosting nötig.
6. Es erscheint ein Code-Block `const firebaseConfig = { ... }`. Diese Werte
   brauchst du gleich.

### Config eintragen

Öffne die Datei [`firebase-config.js`](./firebase-config.js) in diesem Ordner
und trage die Werte aus deinem Firebase-Projekt ein:

```js
window.RUEDIGER_FIREBASE_CONFIG = {
  apiKey: "AIza...",
  authDomain: "ruedigers-birthday.firebaseapp.com",
  projectId: "ruedigers-birthday",
  storageBucket: "ruedigers-birthday.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
```

Diese Werte sind **keine Geheimnisse** — sie stehen im Browser-Code jeder
Firebase-Web-App und sind öffentlich sichtbar. Der eigentliche Schutz kommt
über die Sicherheitsregeln im nächsten Schritt.

### Sicherheitsregeln setzen

Da die Seite keinen echten Login hat (nur ein gemeinsames Passwort auf der
Seite selbst), müssen Firestore und Storage für Schreibzugriffe offen sein.
Damit nicht komplett fremde Bots die Datenbank vollmüllen können, begrenzen
die folgenden Regeln wenigstens Feldgrößen und Dateitypen.

**Firestore-Regeln** (Firestore Database → Regeln, Inhalt ersetzen):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /guestbook/{entryId} {
      allow read: if true;
      allow create: if request.resource.data.name is string
                    && request.resource.data.name.size() < 60
                    && request.resource.data.message is string
                    && request.resource.data.message.size() < 500;
      allow update, delete: if false;
    }
    match /photos/{photoId} {
      allow read: if true;
      allow create: if request.resource.data.url is string;
      allow update, delete: if false;
    }
  }
}
```

**Storage-Regeln** (Storage → Regeln, Inhalt ersetzen):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 12 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

Nach dem Einfügen jeweils auf **Veröffentlichen** klicken.

> ⚠️ Hinweis: Das ist ein pragmatischer Schutz für eine private
> Geburtstagsfeier, keine bankentaugliche Sicherheitslösung. Den Link zur
> Seite solltest du trotzdem nur an eingeladene Gäste weitergeben.

---

## 2. Passwort & Inhalte anpassen

- **Passwort:** in `firebase-config.js`, Variable `RUEDIGER_SITE_PASSWORD`
  (aktuell `150865`).
- **Begrüßungstext:** Das Popup nach dem Passwort begrüßt den Gast und
  beschreibt kurz, was auf der Seite möglich ist (Gästebuch, Fotos, Menü).
  Der Text steht in `index.html` im Abschnitt `#welcome-popup` und lässt sich
  dort direkt anpassen.
- **Termin/Ort:** stehen im Hero-Bereich der `index.html` (Abschnitt
  `event-card`) — dort direkt anpassbar.
- **Illustrationen:** Pfau, Blüte und Farnranken liegen als SVGs in
  `assets/` und lassen sich per Text-Editor in Farbe/Form anpassen (siehe
  `stroke="#c9a24b"` bzw. `fill="#c9a24b"` in den Dateien).

---

## 3. Mit Firebase Hosting veröffentlichen

Da du für Gästebuch & Fotos ohnehin schon ein Firebase-Projekt hast (Schritt 1),
liegt es nahe, die Seite selbst auch dort zu hosten — dann läuft alles
(Datenbank, Speicher, Webseite) unter einem Dach, mit einer kostenlosen
`https://...web.app`-Adresse und automatischem HTTPS.

### Einmalige Einrichtung

1. **Node.js installieren**, falls noch nicht vorhanden:
   [nodejs.org](https://nodejs.org/) (LTS-Version). Node bringt `npm` mit,
   das du für den nächsten Schritt brauchst.
2. **Firebase-Kommandozeilentool installieren** (im Terminal):
   ```bash
   npm install -g firebase-tools
   ```
3. **Anmelden** — öffnet einen Browser zum Google-Login mit demselben Konto,
   das du für das Firebase-Projekt genutzt hast:
   ```bash
   firebase login
   ```
4. **Projekt initialisieren** — im Terminal in den Seitenordner wechseln und
   Hosting einrichten:
   ```bash
   cd rudiger-geburtstag
   firebase init hosting
   ```
   Beantworte die Fragen so:
   - *"Please select an option"* → **Use an existing project** → dein
     Projekt (z. B. `ruedigers-birthday`) auswählen.
   - *"What do you want to use as your public directory?"* → **`.`**
     (einfach Enter drücken, Punkt = aktueller Ordner, da `index.html`
     schon hier liegt).
   - *"Configure as a single-page app?"* → **N** (Nein).
   - *"Set up automatic builds and deploys with GitHub?"* → **N** (Nein,
     reicht für den Anfang).
   - Falls gefragt wird, ob `index.html` überschrieben werden soll → **N**
     (deine vorhandene Datei behalten!).

   Dabei entstehen zwei neue Dateien (`firebase.json`, `.firebaserc`) im
   Ordner — die gehören mit ins Repository, damit du später einfach wieder
   `firebase deploy` aufrufen kannst.

### Veröffentlichen

```bash
firebase deploy --only hosting
```

Am Ende zeigt das Terminal die fertige Adresse an, z. B.:

```
Hosting URL: https://ruedigers-birthday.web.app
```

Diesen Link kannst du direkt an die Gäste verschicken.

### Updates veröffentlichen

Jedes Mal, wenn du an `index.html`, `style.css`, `app.js` oder den Bildern in
`assets/` etwas änderst, einfach im `rudiger-geburtstag`-Ordner erneut:

```bash
firebase deploy --only hosting
```

Nach ein paar Sekunden ist die Änderung live — kein erneutes Einrichten
nötig.

> 💡 Alternative: Auch **GitHub Pages** funktioniert problemlos, falls du
> lieber dabei bleiben möchtest — dafür einfach diesen Ordner in ein
> GitHub-Repository pushen und unter **Settings → Pages** als Quelle
> auswählen. Firebase Hosting hat aber den Vorteil, dass alles (Datenbank,
> Speicher, Webseite) im selben Projekt-Dashboard verwaltet wird.

---

## Lokal testen

Da die Seite `fetch`/Module lädt, am besten mit einem kleinen lokalen Server
öffnen statt die Datei direkt per Doppelklick:

```bash
cd rudiger-geburtstag
python3 -m http.server 8000
# dann im Browser: http://localhost:8000
```

## Dateiübersicht

```
rudiger-geburtstag/
├── index.html            Seitenstruktur (Passwortschranke, Popup, Sektionen)
├── style.css             Art-Deco-Design (Schwarz/Gold, botanische Motive)
├── app.js                Passwortlogik, Firebase-Anbindung (Gästebuch/Fotos)
├── firebase-config.js    Firebase-Zugangsdaten + Seitenpasswort (hier eintragen!)
└── assets/
    ├── peacock.svg         Pfau-Motiv im Hero-Hintergrund
    ├── blossom.svg         Blüten-Symbol (Trenner, Popup-Ornament)
    ├── corner-sprig.svg    Farnranke für die Rahmenecken
    └── fern-spray.svg      Farnzweig im Footer
```
