import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation strings for EN and DE
const translations = {
  en: {
    // Navigation
    nav_map: 'Map',
    nav_groups: 'Groups',
    nav_rankings: 'Rankings',
    nav_profile: 'Profile',
    nav_settings: 'Settings',
    nav_how_it_works: 'How It Works',
    nav_admin: 'Admin',
    nav_logout: 'Logout',
    
    // Dashboard
    welcome: 'Welcome',
    lets_make_berlin_cleaner: "Let's make Berlin cleaner together",
    total_points: 'Total Points',
    my_medals: 'My Medals',
    view_all: 'View All',
    weekly_reports: 'Weekly Reports',
    weekly_cleanups: 'Weekly Cleanups',
    monthly_points: 'Monthly Points',
    your_progress: 'Your progress',
    my_groups: 'My Groups',
    active_memberships: 'Active memberships',
    berlin_wide: 'Berlin-wide',
    upcoming_events: 'Upcoming Group Events',
    view_all_events: 'View all events',
    quick_actions: 'Quick Actions',
    report_trash: 'Report Trash',
    mark_a_spot: 'Mark a spot',
    collect_trash: 'Collect Trash',
    earn_points: 'Earn points',
    join_groups: 'Join Groups',
    team_up: 'Team up',
    leaderboard: 'Leaderboard',
    see_rankings: 'See rankings',
    
    // Map
    report: 'Report',
    clean: 'Clean',
    dashboard: 'Dashboard',
    back: 'Back',
    heat_map: 'Heat Map',
    status: 'Status',
    reported: 'reported',
    collected: 'collected',
    collect_this_trash: 'Collect This Trash',
    delete_report: 'Delete Report',
    cleaned_area: 'Cleaned Area',
    size: 'Size',
    points: 'Points',
    delete_area: 'Delete Area',
    
    // Report Modal
    report_trash_title: 'Report Trash',
    your_location: 'Your Location',
    getting_location: 'Getting your location...',
    location_found: 'Location found!',
    coordinates: 'Coordinates',
    location_error: 'Location Error',
    try_again: 'Try Again',
    get_my_location: 'Get My Location',
    photo_of_trash: 'Photo of Trash',
    uploading: 'Uploading...',
    cancel: 'Cancel',
    
    // Collect Modal
    collect_trash_title: 'Collect Trash',
    original_report: 'Original report:',
    proof_photo: 'Proof Photo (after cleaning)',
    upload_proof_tip: 'Upload a photo showing the area is now clean.',
    processing: 'Processing...',
    
    // Clean Area Modal
    mark_area_cleaned: 'Mark Area as Cleaned',
    center_location: 'Center Location',
    area_size: 'Area Size',
    photo_of_cleaned_area: 'Photo of Cleaned Area',
    
    // Share Modal
    awesome: 'Awesome!',
    you_earned: 'You earned',
    share_achievement: 'Share your achievement with friends!',
    share_my_achievement: 'Share My Achievement',
    shared: 'Shared!',
    link_copied: 'Link Copied!',
    continue: 'Continue',
    
    // Groups
    cleanup_groups: 'Cleanup Groups',
    create_group: 'Create Group',
    all_groups: 'All Groups',
    members: 'members',
    owner: 'Owner',
    view_details: 'View Details',
    delete_group: 'Delete Group',
    leave_group: 'Leave Group',
    join_group: 'Join Group',
    group_name: 'Group Name',
    description: 'Description (optional)',
    create: 'Create',
    creating: 'Creating...',
    upcoming_events_title: 'Upcoming Events',
    create_event: 'Create Event',
    no_upcoming_events: 'No upcoming events',
    event_title: 'Title',
    event_description: 'Description',
    date_time: 'Date & Time',
    event_location: 'Location',
    location_address: 'Address or location name',
    
    // Rankings
    weekly_rankings: 'Weekly Rankings',
    individual_users: 'Individual Users',
    users: 'Users',
    groups: 'Groups',
    loading_rankings: 'Loading rankings...',
    no_rankings_yet: 'No rankings yet this week',
    no_group_rankings: 'No group rankings yet this week',
    points_this_week: 'points this week',
    top_10: 'Top 10',
    
    // Profile
    my_profile: 'My Profile',
    share_my_impact: 'Share My Impact',
    member_since: 'Member since',
    total: 'Total',
    monthly: 'Monthly',
    medals: 'Medals',
    all_time_points: 'All-time points',
    this_month: 'This month',
    achievements: 'Achievements',
    my_medal_collection: 'My Medal Collection',
    no_medals_yet: 'No medals earned yet',
    collect_trash_medals: 'Collect trash to earn monthly medals!',
    medal_requirements: 'Medal Requirements (Monthly)',
    this_months_progress: "This Month's Progress",
    
    // Settings
    account_settings: 'Account Settings',
    account_information: 'Account Information',
    name: 'Name',
    email: 'Email',
    notification_preferences: 'Notification Preferences',
    save_changes: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    testing_mode: 'Testing Mode - Mock Notifications',
    notifications_simulated: 'Notifications are currently simulated for testing.',
    email_notifications: 'Email Notifications',
    receive_updates_email: 'Receive updates via email',
    push_notifications: 'Push Notifications',
    browser_notifications: 'Browser/mobile notifications',
    new_group_events: 'New Group Events',
    notify_events_created: 'Notify when events are created in your groups',
    group_updates: 'Group Updates',
    notify_announcements: 'Notify about group announcements',
    nearby_trash_reports: 'Nearby Trash Reports',
    notify_trash_near: 'Notify about trash near you (coming soon)',
    recent_notifications: 'Recent Notifications (Testing)',
    no_notifications_yet: 'No notifications yet',
    notifications_appear_here: "When someone creates an event in your groups, you'll see it here!",
    
    // Profile Edit
    edit_profile: 'Edit Profile',
    display_name: 'Display Name',
    profile_picture: 'Profile Picture',
    choose_photo: 'Choose Photo',
    upload_new_photo: 'Upload new photo',
    save_profile: 'Save Profile',
    
    // Language
    language: 'Language',
    
    // PWA Install
    install_app: 'Install App',
    pwa_title: 'Add UnTrash Berlin to Home Screen',
    pwa_description: 'Get quick access to the app and use it like a native app!',
    pwa_ios_instructions: 'For iOS (Safari):',
    pwa_ios_step1: '1. Tap the Share button',
    pwa_ios_step2: '2. Scroll and tap "Add to Home Screen"',
    pwa_ios_step3: '3. Tap "Add"',
    pwa_android_instructions: 'For Android (Chrome):',
    pwa_android_step1: '1. Tap the menu (⋮) button',
    pwa_android_step2: '2. Tap "Add to Home screen"',
    pwa_android_step3: '3. Tap "Add"',
    got_it: 'Got it!',
    dont_show_again: "Don't show again",
    
    // Contact Footer
    contact_help: 'Contact & Help',
    questions_feedback: 'Questions or feedback?',
    contact_us: 'Contact us',
    
    // Event time badges
    tomorrow: 'Tomorrow',
    in_days: 'In {days} days',
    today: 'Today',
    
    // Achievement notifications
    medal_earned: 'Medal Earned!',
    congratulations: 'Congratulations!',
  },
  de: {
    // Navigation
    nav_map: 'Karte',
    nav_groups: 'Gruppen',
    nav_rankings: 'Rangliste',
    nav_profile: 'Profil',
    nav_settings: 'Einstellungen',
    nav_how_it_works: 'So funktioniert\'s',
    nav_admin: 'Admin',
    nav_logout: 'Abmelden',
    
    // Dashboard
    welcome: 'Willkommen',
    lets_make_berlin_cleaner: 'Lass uns Berlin gemeinsam sauberer machen',
    total_points: 'Gesamtpunkte',
    my_medals: 'Meine Medaillen',
    view_all: 'Alle anzeigen',
    weekly_reports: 'Wöchentliche Meldungen',
    weekly_cleanups: 'Wöchentliche Aufräumaktionen',
    monthly_points: 'Monatliche Punkte',
    your_progress: 'Dein Fortschritt',
    my_groups: 'Meine Gruppen',
    active_memberships: 'Aktive Mitgliedschaften',
    berlin_wide: 'Berlin-weit',
    upcoming_events: 'Kommende Gruppenevents',
    view_all_events: 'Alle Events anzeigen',
    quick_actions: 'Schnellaktionen',
    report_trash: 'Müll melden',
    mark_a_spot: 'Ort markieren',
    collect_trash: 'Müll sammeln',
    earn_points: 'Punkte verdienen',
    join_groups: 'Gruppen beitreten',
    team_up: 'Team bilden',
    leaderboard: 'Bestenliste',
    see_rankings: 'Rangliste ansehen',
    
    // Map
    report: 'Melden',
    clean: 'Aufräumen',
    dashboard: 'Dashboard',
    back: 'Zurück',
    heat_map: 'Heatmap',
    status: 'Status',
    reported: 'gemeldet',
    collected: 'gesammelt',
    collect_this_trash: 'Diesen Müll sammeln',
    delete_report: 'Meldung löschen',
    cleaned_area: 'Aufgeräumter Bereich',
    size: 'Größe',
    points: 'Punkte',
    delete_area: 'Bereich löschen',
    
    // Report Modal
    report_trash_title: 'Müll melden',
    your_location: 'Dein Standort',
    getting_location: 'Standort wird ermittelt...',
    location_found: 'Standort gefunden!',
    coordinates: 'Koordinaten',
    location_error: 'Standortfehler',
    try_again: 'Erneut versuchen',
    get_my_location: 'Meinen Standort ermitteln',
    photo_of_trash: 'Foto des Mülls',
    uploading: 'Wird hochgeladen...',
    cancel: 'Abbrechen',
    
    // Collect Modal
    collect_trash_title: 'Müll sammeln',
    original_report: 'Original-Meldung:',
    proof_photo: 'Beweis-Foto (nach dem Aufräumen)',
    upload_proof_tip: 'Lade ein Foto hoch, das zeigt, dass der Bereich sauber ist.',
    processing: 'Wird verarbeitet...',
    
    // Clean Area Modal
    mark_area_cleaned: 'Bereich als aufgeräumt markieren',
    center_location: 'Mittelpunkt',
    area_size: 'Flächengröße',
    photo_of_cleaned_area: 'Foto des aufgeräumten Bereichs',
    
    // Share Modal
    awesome: 'Super!',
    you_earned: 'Du hast verdient',
    share_achievement: 'Teile deine Leistung mit Freunden!',
    share_my_achievement: 'Meine Leistung teilen',
    shared: 'Geteilt!',
    link_copied: 'Link kopiert!',
    continue: 'Weiter',
    
    // Groups
    cleanup_groups: 'Aufräumgruppen',
    create_group: 'Gruppe erstellen',
    all_groups: 'Alle Gruppen',
    members: 'Mitglieder',
    owner: 'Inhaber',
    view_details: 'Details anzeigen',
    delete_group: 'Gruppe löschen',
    leave_group: 'Gruppe verlassen',
    join_group: 'Gruppe beitreten',
    group_name: 'Gruppenname',
    description: 'Beschreibung (optional)',
    create: 'Erstellen',
    creating: 'Wird erstellt...',
    upcoming_events_title: 'Kommende Events',
    create_event: 'Event erstellen',
    no_upcoming_events: 'Keine kommenden Events',
    event_title: 'Titel',
    event_description: 'Beschreibung',
    date_time: 'Datum & Uhrzeit',
    event_location: 'Ort',
    location_address: 'Adresse oder Ortsname',
    
    // Rankings
    weekly_rankings: 'Wöchentliche Rangliste',
    individual_users: 'Einzelne Nutzer',
    users: 'Nutzer',
    groups: 'Gruppen',
    loading_rankings: 'Rangliste wird geladen...',
    no_rankings_yet: 'Noch keine Rangliste diese Woche',
    no_group_rankings: 'Noch keine Gruppenrangliste diese Woche',
    points_this_week: 'Punkte diese Woche',
    top_10: 'Top 10',
    
    // Profile
    my_profile: 'Mein Profil',
    share_my_impact: 'Meinen Beitrag teilen',
    member_since: 'Mitglied seit',
    total: 'Gesamt',
    monthly: 'Monatlich',
    medals: 'Medaillen',
    all_time_points: 'Punkte insgesamt',
    this_month: 'Diesen Monat',
    achievements: 'Erfolge',
    my_medal_collection: 'Meine Medaillensammlung',
    no_medals_yet: 'Noch keine Medaillen verdient',
    collect_trash_medals: 'Sammle Müll, um monatliche Medaillen zu verdienen!',
    medal_requirements: 'Medaillen-Anforderungen (Monatlich)',
    this_months_progress: 'Fortschritt diesen Monat',
    
    // Settings
    account_settings: 'Kontoeinstellungen',
    account_information: 'Kontoinformationen',
    name: 'Name',
    email: 'E-Mail',
    notification_preferences: 'Benachrichtigungseinstellungen',
    save_changes: 'Änderungen speichern',
    saving: 'Wird gespeichert...',
    saved: 'Gespeichert!',
    testing_mode: 'Testmodus - Mock-Benachrichtigungen',
    notifications_simulated: 'Benachrichtigungen werden derzeit simuliert.',
    email_notifications: 'E-Mail-Benachrichtigungen',
    receive_updates_email: 'Updates per E-Mail erhalten',
    push_notifications: 'Push-Benachrichtigungen',
    browser_notifications: 'Browser/Mobile-Benachrichtigungen',
    new_group_events: 'Neue Gruppenevents',
    notify_events_created: 'Benachrichtigen, wenn Events in deinen Gruppen erstellt werden',
    group_updates: 'Gruppen-Updates',
    notify_announcements: 'Über Gruppenankündigungen benachrichtigen',
    nearby_trash_reports: 'Müllmeldungen in der Nähe',
    notify_trash_near: 'Über Müll in deiner Nähe benachrichtigen (demnächst)',
    recent_notifications: 'Letzte Benachrichtigungen (Test)',
    no_notifications_yet: 'Noch keine Benachrichtigungen',
    notifications_appear_here: 'Wenn jemand ein Event in deinen Gruppen erstellt, siehst du es hier!',
    
    // Profile Edit
    edit_profile: 'Profil bearbeiten',
    display_name: 'Anzeigename',
    profile_picture: 'Profilbild',
    choose_photo: 'Foto auswählen',
    upload_new_photo: 'Neues Foto hochladen',
    save_profile: 'Profil speichern',
    
    // Language
    language: 'Sprache',
    
    // PWA Install
    install_app: 'App installieren',
    pwa_title: 'UnTrash Berlin zum Startbildschirm hinzufügen',
    pwa_description: 'Schneller Zugriff und Nutzung wie eine native App!',
    pwa_ios_instructions: 'Für iOS (Safari):',
    pwa_ios_step1: '1. Tippe auf den Teilen-Button',
    pwa_ios_step2: '2. Scrolle und tippe auf "Zum Home-Bildschirm"',
    pwa_ios_step3: '3. Tippe auf "Hinzufügen"',
    pwa_android_instructions: 'Für Android (Chrome):',
    pwa_android_step1: '1. Tippe auf das Menü (⋮)',
    pwa_android_step2: '2. Tippe auf "Zum Startbildschirm hinzufügen"',
    pwa_android_step3: '3. Tippe auf "Hinzufügen"',
    got_it: 'Verstanden!',
    dont_show_again: 'Nicht mehr anzeigen',
    
    // Contact Footer
    contact_help: 'Kontakt & Hilfe',
    questions_feedback: 'Fragen oder Feedback?',
    contact_us: 'Kontaktiere uns',
    
    // Event time badges
    tomorrow: 'Morgen',
    in_days: 'In {days} Tagen',
    today: 'Heute',
    
    // Achievement notifications
    medal_earned: 'Medaille verdient!',
    congratulations: 'Herzlichen Glückwunsch!',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('untrash_language');
    if (saved) return saved;
    
    // Auto-detect from browser
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'de' ? 'de' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('untrash_language', language);
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language][key] || translations['en'][key] || key;
    
    // Replace parameters like {days}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
