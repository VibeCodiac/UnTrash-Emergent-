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

## 2. Passwort & Foto anpassen

- **Passwort:** in `firebase-config.js`, Variable `RUEDIGER_SITE_PASSWORD`
  (aktuell `150865`).
- **Begrüßungsfoto:** ersetze `assets/ruediger-placeholder.svg` durch ein
  echtes Foto von Rüdiger. Am einfachsten: eigenes Foto z. B. als
  `assets/ruediger.jpg` ablegen und in `index.html` die Zeile

  ```html
  <img src="assets/ruediger-placeholder.svg" ... id="popup-photo" />
  ```

  auf

  ```html
  <img src="assets/ruediger.jpg" ... id="popup-photo" />
  ```

  ändern.
- **Termin/Ort:** stehen im Hero-Bereich der `index.html` (Abschnitt
  `event-card`) — dort direkt anpassbar.

---

## 3. Mit GitHub Pages veröffentlichen

1. Diesen Ordner (`rudiger-geburtstag/`) in ein GitHub-Repository pushen
   (z. B. `Ruedigers Birthday`).
2. Im Repo: **Settings → Pages**.
3. Unter **Source**: Branch auswählen (z. B. `main`) und als Ordner
   `/rudiger-geburtstag` bzw. bei eigenem Repo-Root `/ (root)` wählen.
4. Speichern — nach kurzer Zeit ist die Seite unter
   `https://<dein-benutzername>.github.io/<repo-name>/` erreichbar.
5. Diesen Link an die Gäste verschicken (z. B. per WhatsApp/Einladung).

Da alles rein statisch ist, funktioniert das ohne eigenen Server — Firebase
übernimmt die Speicherung im Hintergrund.

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
├── style.css             Art-Deco-Design
├── app.js                Passwortlogik, Firebase-Anbindung (Gästebuch/Fotos)
├── firebase-config.js    Firebase-Zugangsdaten + Seitenpasswort (hier eintragen!)
└── assets/
    └── ruediger-placeholder.svg   Platzhalterbild fürs Popup (durch echtes Foto ersetzen)
```
