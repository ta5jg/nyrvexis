/* English (default) — Nyrvexis UI strings.
 *
 * Keys are dotted paths (e.g. "home.cta"). Use {{name}} placeholders for
 * runtime interpolation. Keep this file in sync with tr/es/de — missing keys
 * fall back to English at runtime.
 */
/**
 * Recursively widens string literals in T to plain `string`. Lets us derive the
 * key shape from `en` (which uses `as const`) while letting other locales hold
 * different strings of the same shape.
 */
type WidenStrings<T> = T extends string
  ? string
  : T extends Array<infer U>
    ? Array<WidenStrings<U>>
    : T extends object
      ? { [K in keyof T]: WidenStrings<T[K]> }
      : T;

const enLiteral = {
  app: {
    brand: "NYRVEXIS",
    tagline: "Async tactical squad battles — web & mobile.",
    sameClientNote: "Same client ships on web and in-store shells (Capacitor)."
  },
  home: {
    enterBattle: "Enter battle",
    panelsHint: "Progression, shop, and meta panels load after you enter.",
    gatewayLabel: "Gateway:",
    statusChecking: "Checking…",
    statusConnected: "Connected",
    statusUnavailable: "Unavailable"
  },
  legal: {
    privacy: "Privacy",
    terms: "Terms",
    support: "Support",
    accountAndData: "Account & data",
    storeDisclosure: "Store disclosure notes",
    sectionLabel: "Legal and support"
  },
  language: {
    label: "Language",
    en: "English",
    tr: "Türkçe",
    es: "Español",
    de: "Deutsch"
  },
  section: {
    user: "USER",
    arena: "Arena",
    battle: "Battle",
    result: "Result",
    seasonMeta: "Season & meta",
    cosmetics: "Cosmetics",
    yourPlanet: "Your planet",
    shopDaily: "Shop (daily)",
    collection: "Collection",
    monetization: "Monetization (MVP)",
    purchaseStatus: "Purchase status",
    dailyLeaderboard: "Daily leaderboard",
    shareRewards: "Share rewards",
    push: "Push (daily reminder)"
  },
  auth: {
    email: "Email",
    password: "Password",
    register: "Register",
    signIn: "Sign in",
    signOut: "Sign out",
    linkAccount: "Link account",
    googleSignIn: "Sign in with Google"
  },
  battle: {
    runBattle: "Run battle",
    dailyBattle: "Daily battle",
    yourSquad: "Your squad",
    yourSquadA: "Your squad (A)",
    enemy: "Enemy",
    formationA: "Formation A (slots 0–5 front, 6–11 back)",
    formationB: "Formation B",
    pickFourHint: "Pick four slots, choose an opponent preset, then Run battle or Daily battle.",
    enemyDemo: "Demo team (RIFT)",
    enemyMirror: "Mirror your squad",
    ssotJsonLabel: "SSOT JSON (power users)",
    youPlaySideA: "You play side A · Opponent is side B"
  },
  replay: {
    title: "Replay",
    speed: "Speed",
    autoPlay: "Auto-play",
    autoPlayHint: "Auto-play from your current position.",
    keyboardHint: "Keyboard: ← → scrub · Home End jump · Space play/pause"
  },
  meta: {
    quests: "Quests",
    battlePassTiers: "Battle Pass tiers",
    premiumBattlePass: "Premium Battle Pass (App Store / Play)",
    seasonInfoUnavailable: "Season info unavailable.",
    metaProgressAfterSignIn: "Meta progress loads after sign-in.",
    cosmeticsAfterSignIn: "Sign in to load cosmetics.",
    planetAfterSignIn: "Sign in to load your planet grid.",
    noUnitsYet: "No units yet. Buy from shop.",
    loadingOffers: "Loading offers…",
    balancesNote: "Balances update immediately on success."
  },
  iap: {
    qaPanelTitle: "IAP → Premium BP (QA)",
    platform: "Platform",
    productId: "Product ID",
    receiptOrToken: "Receipt / purchase token"
  },
  onboarding: {
    welcome: "Welcome to NYRVEXIS",
    stepBuildSquad: "Build your squad (4 slots).",
    stepRunBattle: "Press Daily battle (needs gateway OK) or Run battle.",
    stepAutoPlay: "Auto-play to watch from your current position toward the end.",
    stepMissNote: "MISS label — damage floats stay red/gold for hits."
  },
  share: {
    sharedPlanet: "Shared planet"
  },
  errors: {
    unknown: "Unknown error",
    signInFailed: "Sign-in failed",
    registerFailed: "Register failed",
    loginFailed: "Login failed",
    linkFailed: "Link failed",
    signOutFailed: "Sign-out failed",
    googleSignInFailed: "Google sign-in failed",
    pushFailed: "Push failed.",
    planetShareFailed: "Planet share failed.",
    googleOneTapUnavailable: "Google One Tap unavailable in this browser.",
    guestIapBlocked:
      "Link email/Google or register before checkout — real-money purchases must tie to a restorable account (guest IAP blocked)."
  },
  ui: {
    sound: "Sound",
    retry: "Retry",
    dismiss: "Dismiss",
    home: "Home",
    reconnect: "Reconnect",
    claimDaily: "Claim daily",
    refresh: "Refresh",
    account: "Account",
    hide: "Hide",
    show: "Show",
    advancedJsonSuffix: "advanced JSON",
    copyShareLink: "Copy share link",
    copySocialText: "Copy social text",
    exportPng: "Export PNG",
    exportUnityJson: "Export Unity JSON",
    shareToX: "Share to X",
    tutorialSeed: "Tutorial seed",
    newDemo: "New demo",
    replayFromStart: "Replay from start",
    jumpToEnd: "Jump to end",
    battleAgain: "Battle again",
    battlePassAndQuests: "Battle Pass & quests",
    copyPlanetLink: "Copy planet link",
    exportPlanetPng: "Export planet PNG",
    buy: "Buy",
    upgrade: "Upgrade",
    refreshPurchaseStatus: "Refresh purchase status",
    refreshLeaderboard: "Refresh leaderboard",
    playDailyAndSubmit: "Play daily + submit",
    createShareTicket: "Create share ticket (copy link)",
    start: "Start",
    tutorialBattle: "Tutorial battle",
    runABattleToSeeOutput: "Run a battle to see output.",
    simulating: "Simulating…",
    noEntriesYet: "No entries yet.",
    developmentBuild: "Development build",
    productionBuild: "Production build",
    retryGatewayHealthCheck: "Retry gateway health check",
    storeProductSku: "Store product SKU",
    base64ReceiptOrToken: "Base64 receipt or Play purchase token",
    matchSteps: "Match steps",
    formationPreviewHint: "Formation preview — run a battle to animate combat on the arena.",
    scrubAfterBattleHint:
      "After each battle the scrubber jumps to the final tick so HP matches the result — scrub left to replay from the start.",
    mirrorB: "Mirror (B)",
    opponentB: "Opponent (B)",
    frontL: "Front L",
    frontR: "Front R",
    backL: "Back L",
    backR: "Back R",
    emptySlot: "— empty —",
    ownedLabel: "Owned:",
    equippedLabel: "Equipped:",
    noneOwned: "none",
    equipDefaults: "defaults",
    levelShort: "Lv {{level}}",
    seasonEndsOn: "ends {{date}}",
    slotFrame: "Frame",
    slotArena: "Arena",
    slotTitle: "Title",
    equippedSlotTitle: "Equipped {{slot}}"
  },
  match: {
    step1Prepare: "1 · Prepare",
    step2Fight: "2 · Fight",
    step3Result: "3 · Result",
    victory: "Victory",
    defeat: "Defeat",
    draw: "Draw"
  },
  questsUi: {
    claimed: "Claimed",
    claim: "Claim",
    freeOk: "Free ✓",
    claimFree: "Claim free",
    premOk: "Prem ✓",
    claimPremium: "Claim premium"
  },
  quests: {
    q_daily_claim: "Claim daily reward",
    q_daily_submit: "Submit to daily leaderboard",
    q_weekly_lb: "Daily leaderboard submits (5×)",
    q_weekly_shop: "Buy from daily shop (3×)"
  },
  synergies: {
    activeLabel: "Active synergies",
    appliedLabel: "Synergies applied",
    frontline_2: "Frontline (2)",
    frontline_3: "Frontline (3)",
    frontline_4: "Frontline (4)",
    assault_2: "Assault (2)",
    assault_3: "Assault (3)",
    assault_4: "Assault (4)",
    backline_2: "Backline (2)",
    backline_3: "Backline (3)",
    backline_4: "Backline (4)",
    control_2: "Control (2)",
    control_3: "Control (3)",
    vanguard_2: "Vanguard (2)",
    vanguard_3: "Vanguard (3)",
    vanguard_4: "Vanguard (4)",
    marauder_2: "Marauder (2)",
    marauder_3: "Marauder (3)",
    marauder_4: "Marauder (4)",
    arcane_2: "Arcane (2)",
    arcane_3: "Arcane (3)",
    arcane_4: "Arcane (4)",
    ranger_2: "Ranger (2)",
    ranger_3: "Ranger (3)",
    ranger_4: "Ranger (4)",
    order_2: "Order (2)",
    order_3: "Order (3)",
    order_4: "Order (4)"
  },
  cosmetics: {
    cos_frame_nyrvexis_v1: "Nyrvexis frame",
    cos_arena_twilight_v1: "Twilight arena tint",
    cos_title_vanguard_v1: "Vanguard title",
    hub_starter_beacon: "Core beacon",
    hub_twilight_spire: "Twilight spire",
    hub_signal_array: "Signal array"
  },
  iapUi: {
    working: "Working…",
    purchaseOnDevice: "Purchase on device",
    verifying: "Verifying…",
    verifyAndUnlockPremium: "Verify & unlock premium",
    enablePushOnThisDevice: "Enable push on this device"
  },
  pushNotes: {
    notSupported: "Push not supported in this browser.",
    payloadIncomplete: "Subscription payload incomplete.",
    subscribed: "Subscribed. Server can send daily reminders (admin/cron).",
    keysMissing: "Push is off until the gateway has KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY.",
    optional: "Push: optional — configure VAPID keys on gateway to enable."
  },
  authUi: {
    login: "Log in",
    newAccount: "New account",
    linkGuestToEmail: "Link guest → email",
    linkGoogleToGuest: "Link Google to this guest (One Tap)",
    signOutBtn: "Sign out",
    newAccountHint: "New account starts a fresh profile. Link keeps this session's inventory on your email.",
    googleSetupHint: "Sign in with Google requires KR_GOOGLE_CLIENT_ID configured on the gateway with the same Web Client ID.",
    googleOptionalHint: "Optional: add VITE_GOOGLE_CLIENT_ID for Google Sign-In on web."
  },
  notes: {
    dismiss: "Dismiss",
    home: "Home",
    snapshotPreviewExpires: "Snapshot preview · expires {{when}}",
    autoPlayDuration:
      "Full Auto-play at 1× replays from your current scrub position toward the end — about a 4 minute watch from tick 0 to the last tick at 1×.",
    cosmeticsUnlock: "Cosmetics unlock from Battle Pass tiers (server-granted).",
    hubDescription:
      "Cosmetic-only 4×4 hub — place decorations you own. Core beacon is granted on new accounts; more unlock via Battle Pass.",
    buyUnlocksHint: "Buy unlocks a unit at level 1 (v0).",
    checkoutRequiresIdentity:
      "Checkout requires a linked identity (email or Google). Guests cannot open Stripe/IAP-style flows until they sign in.",
    shareTip:
      "Tip: send the copied link to a friend. When they open it, they get a small reward and you get a small reward.",
    deepLinkTip:
      "Tip: this page URL encodes the request. Share it and anyone can replay the same deterministic battle.",
    premiumBpDescription:
      "Unlocks the premium reward track for this season. Your purchase is verified on NYRVEXIS servers.",
    loadingStoreListing:
      "Loading store listing… If this stays empty, confirm the product exists in App Store Connect / Play Console and matches VITE_IAP_BP_PRODUCT_*.",
    streakLine: "Streak {{current}} (best {{best}}) · BP XP {{xp}}",
    premiumUnlocked: "Premium unlocked",
    productionTagline: "Phase 11 • legal/links gate • squad • replay • daily loop",
    hpBarsFollow:
      "HP bars follow the scrubber. New battles open on the last tick; scrub left to watch from the opening, or enable Auto-play from your current position.",
    noEvents: "(no events)",
    pushSubscribeIntro:
      "Web Push: subscribing stores an endpoint on the gateway. Operators can trigger admin or daily-cron sends.",
    seed: "seed",
    maxTicks: "maxTicks",
    me: "ME",
    guest: "guest",
    statusOk: "OK",
    statusDown: "DOWN"
  },
  wallet: {
    connectTronLink: "Connect TronLink",
    installTronLink: "Install TronLink",
    connecting: "Connecting…",
    connected: "Wallet",
    disconnect: "Disconnect",
    connectFailed: "Connection failed",
    payWithUsdtg: "Pay with USDTg",
    verifyingTx: "Verifying transaction…",
    txConfirmed: "Payment confirmed",
    txFailed: "Payment verification failed",
    invalidTxHash: "Invalid transaction hash format",
    premiumOnVerify: "Premium granted on confirmation",
    step1OpenWallet: "Open TronLink (or any TRON wallet).",
    step2SendTo: "Send USDTg to this treasury address:",
    step3Amount: "Amount",
    step4PasteTxHash: "Paste the transaction hash below.",
    iSentIt: "I sent it →",
    copyAddress: "Copy address",
    txHashLabel: "Transaction hash",
    txHashHint: "64-character hex string from your wallet's tx detail view.",
    verify: "Verify",
    back: "Back"
  },
  web3: {
    poweredBy: "Powered by USDTg on TRON",
    earnUsdtg: "Top-100 daily players earn USDTg airdrops",
    web3Note: "Web version supports USDTg cosmetics. Mobile version is fiat-only."
  }
} as const;

export type Translations = WidenStrings<typeof enLiteral>;
export const en: Translations = enLiteral;
