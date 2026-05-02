import type { Translations } from "./en";

export const de: Translations = {
  app: {
    brand: "NYRVEXIS",
    tagline: "Asynchrone taktische Squad-Kämpfe — Web und Mobil.",
    sameClientNote: "Derselbe Client läuft im Web und in den Store-Hüllen (Capacitor)."
  },
  home: {
    enterBattle: "Kampf starten",
    panelsHint: "Fortschritt, Shop und Meta laden, sobald du einsteigst.",
    gatewayLabel: "Gateway:",
    statusChecking: "Prüfe…",
    statusConnected: "Verbunden",
    statusUnavailable: "Nicht verfügbar"
  },
  legal: {
    privacy: "Datenschutz",
    terms: "Bedingungen",
    support: "Support",
    accountAndData: "Konto & Daten",
    storeDisclosure: "Store-Offenlegungshinweise",
    sectionLabel: "Rechtliches und Support"
  },
  language: {
    label: "Sprache",
    en: "English",
    tr: "Türkçe",
    es: "Español",
    de: "Deutsch"
  },
  section: {
    user: "BENUTZER",
    arena: "Arena",
    battle: "Kampf",
    result: "Ergebnis",
    seasonMeta: "Saison & Meta",
    cosmetics: "Kosmetik",
    yourPlanet: "Dein Planet",
    shopDaily: "Shop (täglich)",
    collection: "Sammlung",
    monetization: "Monetarisierung (MVP)",
    purchaseStatus: "Kaufstatus",
    dailyLeaderboard: "Tagesbestenliste",
    shareRewards: "Teilen-Belohnungen",
    push: "Push (Tageserinnerung)"
  },
  auth: {
    email: "E-Mail",
    password: "Passwort",
    register: "Registrieren",
    signIn: "Anmelden",
    signOut: "Abmelden",
    linkAccount: "Konto verknüpfen",
    googleSignIn: "Mit Google anmelden"
  },
  battle: {
    runBattle: "Kampf starten",
    dailyBattle: "Tageskampf",
    yourSquad: "Dein Squad",
    yourSquadA: "Dein Squad (A)",
    enemy: "Gegner",
    formationA: "Formation A (Slots 0–5 vorne, 6–11 hinten)",
    formationB: "Formation B",
    pickFourHint: "Wähle vier Slots, ein Gegner-Preset und drücke Kampf starten oder Tageskampf.",
    enemyDemo: "Demo-Team (RIFT)",
    enemyMirror: "Deinen Squad spiegeln",
    ssotJsonLabel: "SSOT JSON (Profi)",
    youPlaySideA: "Du spielst Seite A · Gegner ist Seite B"
  },
  replay: {
    title: "Wiederholung",
    speed: "Geschwindigkeit",
    autoPlay: "Automatisch abspielen",
    autoPlayHint: "Automatisch ab deiner aktuellen Position abspielen.",
    keyboardHint: "Tastatur: ← → springen · Home End Anfang/Ende · Leertaste play/pause"
  },
  meta: {
    quests: "Aufgaben",
    battlePassTiers: "Battle-Pass-Stufen",
    premiumBattlePass: "Premium Battle Pass (App Store / Play)",
    seasonInfoUnavailable: "Saisoninfos nicht verfügbar.",
    metaProgressAfterSignIn: "Meta-Fortschritt lädt nach der Anmeldung.",
    cosmeticsAfterSignIn: "Anmelden, um Kosmetik zu laden.",
    planetAfterSignIn: "Anmelden, um deinen Planeten zu laden.",
    noUnitsYet: "Noch keine Einheiten. Im Shop kaufen.",
    loadingOffers: "Angebote werden geladen…",
    balancesNote: "Guthaben aktualisieren sich sofort bei Erfolg."
  },
  iap: {
    qaPanelTitle: "IAP → Premium BP (QA)",
    platform: "Plattform",
    productId: "Produkt-ID",
    receiptOrToken: "Beleg / Kauf-Token"
  },
  onboarding: {
    welcome: "Willkommen bei NYRVEXIS",
    stepBuildSquad: "Stelle deinen Squad zusammen (4 Slots).",
    stepRunBattle: "Drücke Tageskampf (Gateway muss OK sein) oder Kampf starten.",
    stepAutoPlay: "Drücke Automatisch abspielen, um von deiner Position bis zum Ende zuzusehen.",
    stepMissNote: "MISS-Label — Schadenszahlen bleiben rot/gold bei Treffern."
  },
  share: {
    sharedPlanet: "Geteilter Planet"
  },
  errors: {
    unknown: "Unbekannter Fehler",
    signInFailed: "Anmeldung fehlgeschlagen",
    registerFailed: "Registrierung fehlgeschlagen",
    loginFailed: "Anmeldung fehlgeschlagen",
    linkFailed: "Verknüpfung fehlgeschlagen",
    signOutFailed: "Abmeldung fehlgeschlagen",
    googleSignInFailed: "Google-Anmeldung fehlgeschlagen",
    pushFailed: "Push fehlgeschlagen.",
    planetShareFailed: "Planet-Teilen fehlgeschlagen.",
    googleOneTapUnavailable: "Google One Tap in diesem Browser nicht verfügbar.",
    guestIapBlocked:
      "E-Mail/Google verknüpfen oder registrieren vor dem Kauf — Echtgeldkäufe müssen an ein wiederherstellbares Konto gebunden sein (Gast-IAP gesperrt)."
  },
  ui: {
    sound: "Ton",
    retry: "Wiederholen",
    dismiss: "Verwerfen",
    home: "Start",
    reconnect: "Erneut verbinden",
    claimDaily: "Tagesbelohnung",
    refresh: "Aktualisieren",
    account: "Konto",
    hide: "Verbergen",
    show: "Anzeigen",
    advancedJsonSuffix: "erweitertes JSON",
    copyShareLink: "Teilen-Link kopieren",
    copySocialText: "Social-Text kopieren",
    exportPng: "PNG exportieren",
    exportUnityJson: "Unity-JSON exportieren",
    shareToX: "Auf X teilen",
    tutorialSeed: "Tutorial-Seed",
    newDemo: "Neue Demo",
    replayFromStart: "Von Anfang abspielen",
    jumpToEnd: "Zum Ende springen",
    battleAgain: "Erneut kämpfen",
    battlePassAndQuests: "Battle Pass & Aufgaben",
    copyPlanetLink: "Planet-Link kopieren",
    exportPlanetPng: "Planet-PNG exportieren",
    buy: "Kaufen",
    upgrade: "Verbessern",
    refreshPurchaseStatus: "Kaufstatus aktualisieren",
    refreshLeaderboard: "Bestenliste aktualisieren",
    playDailyAndSubmit: "Tageskampf + senden",
    createShareTicket: "Teilen-Ticket erstellen (Link kopieren)",
    start: "Starten",
    tutorialBattle: "Tutorial-Kampf",
    runABattleToSeeOutput: "Starte einen Kampf, um die Ausgabe zu sehen.",
    simulating: "Simuliere…",
    noEntriesYet: "Noch keine Einträge.",
    developmentBuild: "Entwicklungs-Build",
    productionBuild: "Produktions-Build",
    retryGatewayHealthCheck: "Gateway-Gesundheitsprüfung wiederholen",
    storeProductSku: "Store-Produkt-SKU",
    base64ReceiptOrToken: "Base64-Beleg oder Play-Kauf-Token",
    matchSteps: "Match-Schritte",
    formationPreviewHint: "Formationsvorschau — starte einen Kampf, um die Animation in der Arena zu sehen.",
    scrubAfterBattleHint:
      "Nach jedem Kampf springt der Schieber zum letzten Tick, damit HP zum Ergebnis passt — nach links scrubben, um von vorne abzuspielen.",
    mirrorB: "Spiegel (B)",
    opponentB: "Gegner (B)",
    frontL: "Vorne L",
    frontR: "Vorne R",
    backL: "Hinten L",
    backR: "Hinten R",
    emptySlot: "— leer —",
    ownedLabel: "Besitz:",
    equippedLabel: "Ausgerüstet:",
    noneOwned: "keine",
    equipDefaults: "Standard",
    levelShort: "Stf. {{level}}",
    seasonEndsOn: "endet {{date}}",
    slotFrame: "Rahmen",
    slotArena: "Arena",
    slotTitle: "Titel",
    equippedSlotTitle: "Ausgerüstet: {{slot}}"
  },
  match: {
    step1Prepare: "1 · Vorbereitung",
    step2Fight: "2 · Kampf",
    step3Result: "3 · Ergebnis",
    victory: "Sieg",
    defeat: "Niederlage",
    draw: "Unentschieden"
  },
  questsUi: {
    claimed: "Eingelöst",
    claim: "Einlösen",
    freeOk: "Kostenlos ✓",
    claimFree: "Kostenlos einlösen",
    premOk: "Premium ✓",
    claimPremium: "Premium einlösen"
  },
  quests: {
    q_daily_claim: "Tägliche Belohnung einlösen",
    q_daily_submit: "An tägliche Bestenliste senden",
    q_weekly_lb: "Tägliche Bestenlisten-Einreichungen (5×)",
    q_weekly_shop: "Im Tagesshop kaufen (3×)"
  },
  cosmetics: {
    cos_frame_nyrvexis_v1: "Nyrvexis-Rahmen",
    cos_arena_twilight_v1: "Zwielicht-Arenatönung",
    cos_title_vanguard_v1: "Vorhut-Titel",
    hub_starter_beacon: "Kernbake",
    hub_twilight_spire: "Zwielicht-Spitze",
    hub_signal_array: "Signal-Array"
  },
  iapUi: {
    working: "Verarbeite…",
    purchaseOnDevice: "Auf Gerät kaufen",
    verifying: "Überprüfe…",
    verifyAndUnlockPremium: "Überprüfen & Premium freischalten",
    enablePushOnThisDevice: "Push auf diesem Gerät aktivieren"
  },
  pushNotes: {
    notSupported: "Push wird in diesem Browser nicht unterstützt.",
    payloadIncomplete: "Subscription-Payload unvollständig.",
    subscribed: "Abonniert. Der Server kann tägliche Erinnerungen senden (Admin/Cron).",
    keysMissing: "Push ist deaktiviert, bis das Gateway KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY hat.",
    optional: "Push: optional — VAPID-Schlüssel im Gateway konfigurieren, um zu aktivieren."
  },
  authUi: {
    login: "Anmelden",
    newAccount: "Neues Konto",
    linkGuestToEmail: "Gast → E-Mail verknüpfen",
    linkGoogleToGuest: "Google mit diesem Gast verknüpfen (One Tap)",
    signOutBtn: "Abmelden",
    newAccountHint: "Neues Konto startet ein leeres Profil. Verknüpfen behält das Inventar dieser Sitzung an deiner E-Mail.",
    googleSetupHint: "Anmelden mit Google erfordert KR_GOOGLE_CLIENT_ID am Gateway mit derselben Web-Client-ID.",
    googleOptionalHint: "Optional: VITE_GOOGLE_CLIENT_ID hinzufügen, um Google-Anmeldung im Web zu nutzen."
  },
  notes: {
    dismiss: "Verwerfen",
    home: "Start",
    snapshotPreviewExpires: "Snapshot-Vorschau · läuft ab {{when}}",
    autoPlayDuration:
      "Volle automatische Wiedergabe bei 1× spielt von deiner aktuellen Position bis zum Ende — etwa 4 Minuten von Tick 0 bis zum letzten Tick bei 1×.",
    cosmeticsUnlock: "Kosmetik schaltet sich über Battle-Pass-Stufen frei (vom Server vergeben).",
    hubDescription:
      "Reines Kosmetik-4×4-Hub — platziere deine Dekorationen. Die zentrale Bake bekommen neue Konten; mehr per Battle Pass.",
    buyUnlocksHint: "Kauf schaltet eine Einheit auf Stufe 1 frei (v0).",
    checkoutRequiresIdentity:
      "Checkout erfordert eine verknüpfte Identität (E-Mail oder Google). Gäste können Stripe/IAP-Flows erst nach Anmeldung öffnen.",
    shareTip:
      "Tipp: schicke den kopierten Link an eine Freundin/einen Freund. Beim Öffnen bekommt sie/er eine kleine Belohnung — und du auch.",
    deepLinkTip:
      "Tipp: diese Seiten-URL kodiert die Anfrage. Teile sie und jeder kann denselben deterministischen Kampf abspielen.",
    premiumBpDescription:
      "Schaltet die Premium-Belohnungsspur für diese Saison frei. Dein Kauf wird auf NYRVEXIS-Servern verifiziert.",
    loadingStoreListing:
      "Store-Eintrag wird geladen… Wenn leer, prüfe, ob das Produkt in App Store Connect / Play Console existiert und VITE_IAP_BP_PRODUCT_* entspricht.",
    streakLine: "Serie {{current}} (Bestwert {{best}}) · BP XP {{xp}}",
    premiumUnlocked: "Premium freigeschaltet",
    productionTagline: "Phase 11 • Rechts-/Link-Gate • Squad • Wiedergabe • Tagesloop",
    hpBarsFollow:
      "HP-Balken folgen dem Schieber. Neue Kämpfe öffnen am letzten Tick; nach links scrubben oder Automatisch abspielen aktivieren.",
    noEvents: "(keine Ereignisse)",
    pushSubscribeIntro:
      "Web Push: Abonnieren speichert einen Endpunkt am Gateway. Betreiber können Admin- oder Tages-Cron-Sendungen auslösen.",
    seed: "Seed",
    maxTicks: "max Ticks",
    me: "ICH",
    guest: "Gast",
    statusOk: "OK",
    statusDown: "OFFLINE"
  }
};
