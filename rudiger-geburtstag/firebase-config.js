// ============================================================================
// FIREBASE-KONFIGURATION
// ============================================================================
// Damit Gästebuch-Einträge und Fotos für ALLE Gäste sichtbar gespeichert
// werden, braucht diese Seite ein kostenloses Firebase-Projekt (Google).
//
// Schritt-für-Schritt-Anleitung: siehe README.md im selben Ordner.
//
// Trage unten die Werte aus deinem Firebase-Projekt ein (Projekteinstellungen
// -> "Meine Apps" -> Web-App -> "SDK-Setup und Konfiguration" -> "Config").
// Diese Werte sind KEINE Geheimnisse (sie stehen im Browser-Code jeder
// Firebase-Web-App) - der eigentliche Schutz passiert über die Firestore-/
// Storage-Regeln, die in der README beschrieben sind.
// ============================================================================

window.RUEDIGER_FIREBASE_CONFIG = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID",
};

// Passwort für den Zugang zur Seite (einfacher Schutz vor Fremden,
// keine echte Sicherheitsfunktion - der Link sollte trotzdem nur an
// eingeladene Gäste weitergegeben werden).
window.RUEDIGER_SITE_PASSWORD = "150865";
