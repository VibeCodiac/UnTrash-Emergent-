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
// Firebase-Web-App) - der eigentliche Schutz passiert über die Firestore-
// Regeln, die in der README beschrieben sind.
//
// Hinweis: Fotos werden komprimiert direkt in Firestore gespeichert (nicht
// in Firebase Storage), damit die Seite komplett im kostenlosen Spark-Tarif
// bleibt und keine Kreditkarte hinterlegt werden muss.
// ============================================================================

window.RUEDIGER_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDirBF3q4dWYw2-0KIQbg1tL-xH0EGf5VM",
  authDomain: "ruedigers-geburtstag.firebaseapp.com",
  projectId: "ruedigers-geburtstag",
  messagingSenderId: "487964270336",
  appId: "1:487964270336:web:39670e71da1def50e8dde5",
};

// Passwort für den Zugang zur Seite (einfacher Schutz vor Fremden,
// keine echte Sicherheitsfunktion - der Link sollte trotzdem nur an
// eingeladene Gäste weitergegeben werden).
window.RUEDIGER_SITE_PASSWORD = "150865";
