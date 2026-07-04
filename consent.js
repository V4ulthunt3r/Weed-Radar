/*
 * Weed Radar — Consent & Tracking-Loader (Vanilla JS, kein Build nötig)
 * ---------------------------------------------------------------------
 * - 3 Kategorien: Necessary (immer an), Analytics, Marketing/Ads
 * - Auswahl in localStorage ("wr_consent_v1")
 * - Buttons: Alle akzeptieren / Nur notwendig / Auswahl speichern
 * - Re-Open jederzeit via window.WRConsent.open()
 * - Lädt Microsoft Clarity + Google Analytics 4 erst nach Analytics-Consent
 * - Lädt Google AdSense (Auto Ads) erst nach Marketing-Consent
 * - Berücksichtigt Microsoft Clarity Consent + Google Consent Mode v2
 * - Lädt nichts, wenn die jeweilige ID leer/Platzhalter ("XXXX") ist
 *
 * Erwartet window.WR_TRACKING_CONFIG (siehe consent-config.js), VOR diesem Skript geladen.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "wr_consent_v1";
  var CFG = window.WR_TRACKING_CONFIG || {};

  // Sprache aus <html lang> ableiten (de Fallback)
  var isEN = (document.documentElement.lang || "de").toLowerCase().indexOf("en") === 0;

  var T = isEN ? {
    title: "Privacy & cookies",
    body: "We use optional services for analytics and advertising only with your consent. Necessary functions work without cookies.",
    necessary: "Necessary",
    necessaryDesc: "Required for the site to work. Always on.",
    analytics: "Analytics",
    analyticsDesc: "Microsoft Clarity & Google Analytics — usage statistics.",
    marketing: "Marketing / Ads",
    marketingDesc: "Google AdSense — to display advertising.",
    acceptAll: "Accept all",
    necessaryOnly: "Necessary only",
    save: "Save selection",
    privacy: "Privacy policy",
    privacyHref: "./privacy.html"
  } : {
    title: "Datenschutz & Cookies",
    body: "Optionale Analyse- und Werbedienste nutzen wir nur mit deiner Einwilligung. Notwendige Funktionen kommen ohne Cookies aus.",
    necessary: "Notwendig",
    necessaryDesc: "Für den Betrieb der Seite erforderlich. Immer aktiv.",
    analytics: "Analyse",
    analyticsDesc: "Microsoft Clarity & Google Analytics — Nutzungsstatistik.",
    marketing: "Marketing / Werbung",
    marketingDesc: "Google AdSense — zur Anzeige von Werbung.",
    acceptAll: "Alle akzeptieren",
    necessaryOnly: "Nur notwendig",
    save: "Auswahl speichern",
    privacy: "Datenschutzerklärung",
    privacyHref: "./privacy.html"
  };

  // Privacy-Link relativieren (EN-Seiten liegen in /en/)
  if (isEN) T.privacyHref = "./privacy.html"; // EN privacy liegt neben EN-Seiten

  // Welche Skripte sind in DIESER Session bereits injiziert? (gegen doppelte Injektion)
  var loaded = { clarity: false, ga: false, adsense: false };

  // AdSense-Freischaltungs-Modus: Script sofort laden (vor Consent), damit der
  // Google-Crawler den Code findet. Nach Genehmigung in der Config auf false setzen.
  var verificationActive = (CFG.adsenseVerificationMode === true);

  // ---- Helpers ---------------------------------------------------------
  function isSet(v) { return typeof v === "string" && v.length > 0 && v.indexOf("XXXX") === -1; }

  // AdSense funktioniert nicht auf localhost/file:// und lädt dort schwere Auto-Ads-/
  // Betrugserkennungs-Skripte, die die Seite ausbremsen. Nur auf echter Domain laden.
  function isProductionHost() {
    var h = location.hostname;
    if (!h) return false; // file://
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]") return false;
    if (h.indexOf(".local") !== -1 || h.indexOf(".test") !== -1) return false;
    return true;
  }

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }
  function writeConsent(c) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch (e) {}
  }

  // ---- Loader: Microsoft Clarity --------------------------------------
  function loadClarity() {
    if (loaded.clarity || !isSet(CFG.clarityProjectId)) return;
    loaded.clarity = true;
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CFG.clarityProjectId);
    // Clarity Consent Mode: Einwilligung signalisieren (nur wenn erteilt)
    try { window.clarity("consent"); } catch (e) {}
  }

  // ---- Loader: Google Analytics 4 -------------------------------------
  function loadGA() {
    if (loaded.ga || !isSet(CFG.gaMeasurementId)) return;
    loaded.ga = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    // Consent Mode v2: Defaults auf denied, danach gezielt updaten
    window.gtag("consent", "default", {
      ad_storage: "denied", ad_user_data: "denied",
      ad_personalization: "denied", analytics_storage: "denied"
    });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CFG.gaMeasurementId);
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", CFG.gaMeasurementId, { anonymize_ip: true });
  }

  // ---- Loader: Google AdSense Auto Ads --------------------------------
  function loadAdSense() {
    if (loaded.adsense || !isSet(CFG.adsenseClientId)) return;
    if (!isProductionHost()) return; // lokal überspringen (localhost/file://)
    loaded.adsense = true;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
      encodeURIComponent(CFG.adsenseClientId);
    document.head.appendChild(s);
    // Auto Ads werden im AdSense-Dashboard pro Konto aktiviert — keine manuellen Ad-Units nötig.
  }

  // ---- Google Consent Mode update -------------------------------------
  function updateGoogleConsent(consent) {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: consent.analytics ? "granted" : "denied",
        ad_storage: consent.marketing ? "granted" : "denied",
        ad_user_data: consent.marketing ? "granted" : "denied",
        ad_personalization: consent.marketing ? "granted" : "denied"
      });
    }
  }

  // ---- Consent anwenden -----------------------------------------------
  function apply(consent) {
    if (consent.analytics) { loadClarity(); loadGA(); }
    if (consent.marketing) { loadAdSense(); }
    updateGoogleConsent(consent);
  }

  // Wurde eine bereits geladene Kategorie widerrufen? -> Reload, damit Skripte nicht aktiv bleiben.
  // Ausnahme: im Verification-Modus bleibt AdSense absichtlich geladen.
  function needsReloadAfter(consent) {
    if ((loaded.clarity || loaded.ga) && !consent.analytics) return true;
    if (!verificationActive && loaded.adsense && !consent.marketing) return true;
    return false;
  }

  // ---- UI --------------------------------------------------------------
  var bannerEl = null;

  function injectStyles() {
    if (document.getElementById("wr-consent-style")) return;
    var css = "" +
      "#wr-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;padding:16px;" +
      "background:var(--surface,#131c16);color:var(--text,#e9f2ec);border-top:1px solid var(--border,rgba(126,224,160,.18));" +
      "box-shadow:0 -10px 30px -12px rgba(0,0,0,.6);font-family:Roboto,system-ui,sans-serif;}" +
      "#wr-consent .wr-c-inner{max-width:1140px;margin:0 auto;display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap;}" +
      "#wr-consent h2{font-size:1.05rem;margin:0 0 6px;}" +
      "#wr-consent p{margin:0 0 8px;color:var(--text-dim,#9fb4a6);font-size:.9rem;line-height:1.5;}" +
      "#wr-consent a{color:var(--accent-bright,#8ef0ad);}" +
      "#wr-consent .wr-c-main{flex:1 1 360px;min-width:280px;}" +
      "#wr-consent .wr-c-opts{display:flex;flex-direction:column;gap:8px;margin:10px 0;}" +
      "#wr-consent label.wr-opt{display:flex;gap:10px;align-items:flex-start;font-size:.88rem;color:var(--text,#e9f2ec);}" +
      "#wr-consent label.wr-opt span small{display:block;color:var(--text-faint,#6f8579);font-size:.78rem;}" +
      "#wr-consent input[type=checkbox]{margin-top:3px;accent-color:var(--accent,#5fd68a);width:16px;height:16px;}" +
      "#wr-consent .wr-c-actions{display:flex;flex-direction:column;gap:10px;flex:0 0 auto;min-width:200px;}" +
      "#wr-consent button{cursor:pointer;font-weight:600;font-size:.92rem;padding:11px 18px;border-radius:999px;border:1px solid var(--border,rgba(126,224,160,.18));}" +
      "#wr-consent button.wr-primary{background:linear-gradient(135deg,var(--accent-bright,#8ef0ad),var(--accent-dim,#3fa86a));color:#05140b;border:none;}" +
      "#wr-consent button.wr-ghost{background:transparent;color:var(--text,#e9f2ec);}" +
      "#wr-consent button.wr-ghost:hover{border-color:var(--accent,#5fd68a);color:var(--accent-bright,#8ef0ad);}" +
      "@media(max-width:720px){#wr-consent .wr-c-actions{flex:1 1 100%;}}";
    var st = document.createElement("style");
    st.id = "wr-consent-style";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function buildBanner(current) {
    injectStyles();
    if (bannerEl) { bannerEl.parentNode.removeChild(bannerEl); bannerEl = null; }

    var a = current && current.analytics;
    var m = current && current.marketing;

    var wrap = document.createElement("div");
    wrap.id = "wr-consent";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", T.title);
    wrap.innerHTML =
      '<div class="wr-c-inner">' +
        '<div class="wr-c-main">' +
          '<h2>' + T.title + '</h2>' +
          '<p>' + T.body + ' <a href="' + T.privacyHref + '">' + T.privacy + '</a></p>' +
          '<div class="wr-c-opts">' +
            '<label class="wr-opt"><input type="checkbox" checked disabled>' +
              '<span>' + T.necessary + '<small>' + T.necessaryDesc + '</small></span></label>' +
            '<label class="wr-opt"><input type="checkbox" id="wr-c-analytics"' + (a ? " checked" : "") + '>' +
              '<span>' + T.analytics + '<small>' + T.analyticsDesc + '</small></span></label>' +
            '<label class="wr-opt"><input type="checkbox" id="wr-c-marketing"' + (m ? " checked" : "") + '>' +
              '<span>' + T.marketing + '<small>' + T.marketingDesc + '</small></span></label>' +
          '</div>' +
        '</div>' +
        '<div class="wr-c-actions">' +
          '<button class="wr-primary" id="wr-c-all">' + T.acceptAll + '</button>' +
          '<button class="wr-ghost" id="wr-c-save">' + T.save + '</button>' +
          '<button class="wr-ghost" id="wr-c-none">' + T.necessaryOnly + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(wrap);
    bannerEl = wrap;

    document.getElementById("wr-c-all").addEventListener("click", function () {
      saveAndClose({ necessary: true, analytics: true, marketing: true });
    });
    document.getElementById("wr-c-none").addEventListener("click", function () {
      saveAndClose({ necessary: true, analytics: false, marketing: false });
    });
    document.getElementById("wr-c-save").addEventListener("click", function () {
      saveAndClose({
        necessary: true,
        analytics: document.getElementById("wr-c-analytics").checked,
        marketing: document.getElementById("wr-c-marketing").checked
      });
    });
  }

  function closeBanner() {
    if (bannerEl) { bannerEl.parentNode.removeChild(bannerEl); bannerEl = null; }
  }

  function saveAndClose(consent) {
    consent.ts = Date.now();
    writeConsent(consent);
    closeBanner();
    if (needsReloadAfter(consent)) { location.reload(); return; }
    apply(consent);
  }

  // ---- Öffentliche API -------------------------------------------------
  window.WRConsent = {
    open: function () { buildBanner(readConsent()); },
    get: function () { return readConsent(); },
    reset: function () { try { localStorage.removeItem(STORAGE_KEY); } catch (e) {} buildBanner(null); }
  };

  // ---- Start -----------------------------------------------------------
  function init() {
    // Freischaltungs-Modus: AdSense sofort laden, unabhängig vom Consent.
    if (verificationActive) { loadAdSense(); }

    var stored = readConsent();
    if (stored) { apply(stored); }      // bereits entschieden -> anwenden, kein Banner
    else { buildBanner(null); }         // noch keine Wahl -> Banner zeigen
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
