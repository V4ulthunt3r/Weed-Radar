/*
 * Weed Radar — Tracking-/Ads-Konfiguration
 * =========================================
 * Diese Datei ersetzt die im Briefing genannten NEXT_PUBLIC_* Environment-Variablen.
 * Grund: Die Seite ist statisches HTML auf GitHub Pages — es gibt keinen Build-Step
 * und keine Runtime-Env-Vars. Trage die IDs hier ein (oder lass sie leer).
 *
 *   NEXT_PUBLIC_CLARITY_PROJECT_ID   -> clarityProjectId
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID    -> gaMeasurementId
 *   NEXT_PUBLIC_ADSENSE_CLIENT_ID    -> adsenseClientId   (Format: ca-pub-XXXXXXXXXXXXXXX)
 *
 * WICHTIG:
 * - Leere Werte ODER Platzhalter mit "XXXX" => der jeweilige Dienst wird NICHT geladen.
 * - Es werden grundsätzlich nur Skripte nach passender Einwilligung geladen
 *   (Analyse -> Clarity + GA4, Marketing/Ads -> AdSense).
 * - Keine echten produktiven IDs committen, wenn das Repo öffentlich ist und du das
 *   nicht möchtest — Publisher-/Measurement-IDs sind allerdings ohnehin clientseitig sichtbar.
 */
window.WR_TRACKING_CONFIG = {
  // Microsoft Clarity Project ID (z. B. "abcdefghij")
  clarityProjectId: "",

  // Google Analytics 4 Measurement ID (z. B. "G-XXXXXXXXXX")
  gaMeasurementId: "",

  // Google AdSense Publisher ID (Format "ca-pub-XXXXXXXXXXXXXXX")
  adsenseClientId: "ca-pub-2073299587219148",

  // --- AdSense Freischaltungs-Modus ---------------------------------------
  // true  = AdSense-Script wird SOFORT im <head> geladen (vor/ohne Consent),
  //         damit Googles Prüf-Crawler den Code findet -> NUR für die
  //         erstmalige Freischaltung der Seite verwenden.
  // false = AdSense lädt erst nach Einwilligung "Marketing/Werbung" (DSGVO-konform).
  //
  // TODO: Nach erfolgreicher AdSense-Genehmigung wieder auf "false" setzen!
  adsenseVerificationMode: true
};
