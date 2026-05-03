import type { Translations } from "./en";

export const tr: Translations = {
  app: {
    brand: "NYRVEXIS",
    tagline: "Asenkron taktik takım savaşları — web ve mobil.",
    sameClientNote: "Aynı istemci hem web'de hem de mağaza kabuklarında (Capacitor) çalışır."
  },
  home: {
    enterBattle: "Savaşa gir",
    panelsHint: "İlerleme, mağaza ve meta panelleri girdiğinde yüklenir.",
    gatewayLabel: "Sunucu:",
    statusChecking: "Kontrol ediliyor…",
    statusConnected: "Bağlı",
    statusUnavailable: "Erişilemiyor"
  },
  legal: {
    privacy: "Gizlilik",
    terms: "Şartlar",
    support: "Destek",
    accountAndData: "Hesap ve veri",
    storeDisclosure: "Mağaza beyanı notları",
    sectionLabel: "Yasal ve destek"
  },
  language: {
    label: "Dil",
    en: "English",
    tr: "Türkçe",
    es: "Español",
    de: "Deutsch"
  },
  section: {
    user: "KULLANICI",
    arena: "Arena",
    battle: "Savaş",
    result: "Sonuç",
    seasonMeta: "Sezon ve meta",
    cosmetics: "Kozmetikler",
    yourPlanet: "Gezegenin",
    shopDaily: "Mağaza (günlük)",
    collection: "Koleksiyon",
    monetization: "Para kazanma (MVP)",
    purchaseStatus: "Satın alma durumu",
    dailyLeaderboard: "Günlük lider tablosu",
    shareRewards: "Paylaşım ödülleri",
    push: "Bildirim (günlük hatırlatma)"
  },
  auth: {
    email: "E-posta",
    password: "Şifre",
    register: "Kayıt ol",
    signIn: "Giriş yap",
    signOut: "Çıkış yap",
    linkAccount: "Hesabı bağla",
    googleSignIn: "Google ile giriş yap"
  },
  battle: {
    runBattle: "Savaşı başlat",
    dailyBattle: "Günlük savaş",
    yourSquad: "Takımın",
    yourSquadA: "Takımın (A)",
    enemy: "Düşman",
    formationA: "Formasyon A (0–5 ön, 6–11 arka)",
    formationB: "Formasyon B",
    pickFourHint: "Dört slot seç, bir rakip ön ayarı belirle, sonra Savaşı başlat veya Günlük savaş.",
    enemyDemo: "Demo takım (RIFT)",
    enemyMirror: "Aynı kadronu yansıt",
    ssotJsonLabel: "SSOT JSON (ileri kullanıcı)",
    youPlaySideA: "A tarafında oynuyorsun · Rakip B tarafı"
  },
  replay: {
    title: "Tekrar oynat",
    speed: "Hız",
    autoPlay: "Otomatik oynat",
    autoPlayHint: "Mevcut konumdan otomatik oynat.",
    keyboardHint: "Klavye: ← → kaydır · Home End başa/sona · Space oynat/duraklat"
  },
  meta: {
    quests: "Görevler",
    battlePassTiers: "Battle Pass kademeleri",
    premiumBattlePass: "Premium Battle Pass (App Store / Play)",
    seasonInfoUnavailable: "Sezon bilgisi yok.",
    metaProgressAfterSignIn: "Meta ilerleme giriş yaptıktan sonra yüklenir.",
    cosmeticsAfterSignIn: "Kozmetikleri yüklemek için giriş yap.",
    planetAfterSignIn: "Gezegen ızgaranı yüklemek için giriş yap.",
    noUnitsYet: "Henüz birim yok. Mağazadan satın al.",
    loadingOffers: "Teklifler yükleniyor…",
    balancesNote: "Bakiyeler başarıyla anında güncellenir."
  },
  iap: {
    qaPanelTitle: "IAP → Premium BP (QA)",
    platform: "Platform",
    productId: "Ürün kimliği",
    receiptOrToken: "Makbuz / satın alma token"
  },
  onboarding: {
    welcome: "NYRVEXIS'e hoş geldin",
    stepBuildSquad: "Takımını kur (4 slot).",
    stepRunBattle: "Günlük savaş (sunucu OK ister) veya Savaşı başlat'a bas.",
    stepAutoPlay: "Mevcut konumundan sona kadar izlemek için Otomatik oynat.",
    stepMissNote: "MISS etiketi — vuruşlarda hasar yazıları kırmızı/altın kalır."
  },
  share: {
    sharedPlanet: "Paylaşılan gezegen"
  },
  errors: {
    unknown: "Bilinmeyen hata",
    signInFailed: "Giriş başarısız",
    registerFailed: "Kayıt başarısız",
    loginFailed: "Giriş başarısız",
    linkFailed: "Bağlantı başarısız",
    signOutFailed: "Çıkış başarısız",
    googleSignInFailed: "Google ile giriş başarısız",
    pushFailed: "Bildirim başarısız.",
    planetShareFailed: "Gezegen paylaşımı başarısız.",
    googleOneTapUnavailable: "Bu tarayıcıda Google One Tap kullanılamıyor.",
    guestIapBlocked:
      "Ödemeden önce e-posta/Google bağla veya kayıt ol — gerçek para satın almaları geri yüklenebilir bir hesaba bağlı olmalıdır (misafir IAP engellenir)."
  },
  ui: {
    sound: "Ses",
    retry: "Tekrar dene",
    dismiss: "Kapat",
    home: "Ana sayfa",
    reconnect: "Yeniden bağlan",
    claimDaily: "Günlüğü al",
    refresh: "Yenile",
    account: "Hesap",
    hide: "Gizle",
    show: "Göster",
    advancedJsonSuffix: "ileri JSON",
    copyShareLink: "Paylaşım linkini kopyala",
    copySocialText: "Sosyal medya metnini kopyala",
    exportPng: "PNG dışa aktar",
    exportUnityJson: "Unity JSON dışa aktar",
    shareToX: "X'te paylaş",
    tutorialSeed: "Öğretici tohum",
    newDemo: "Yeni demo",
    replayFromStart: "Baştan oynat",
    jumpToEnd: "Sona atla",
    battleAgain: "Tekrar savaş",
    battlePassAndQuests: "Battle Pass ve görevler",
    copyPlanetLink: "Gezegen linkini kopyala",
    exportPlanetPng: "Gezegen PNG dışa aktar",
    buy: "Satın al",
    upgrade: "Yükselt",
    refreshPurchaseStatus: "Satın alma durumunu yenile",
    refreshLeaderboard: "Lider tablosunu yenile",
    playDailyAndSubmit: "Günlüğü oyna + gönder",
    createShareTicket: "Paylaşım bileti oluştur (link kopyala)",
    start: "Başla",
    tutorialBattle: "Öğretici savaş",
    runABattleToSeeOutput: "Çıktıyı görmek için bir savaş başlat.",
    simulating: "Simüle ediliyor…",
    noEntriesYet: "Henüz kayıt yok.",
    developmentBuild: "Geliştirme yapısı",
    productionBuild: "Üretim yapısı",
    retryGatewayHealthCheck: "Sunucu sağlık kontrolünü tekrar dene",
    storeProductSku: "Mağaza ürün SKU'su",
    base64ReceiptOrToken: "Base64 makbuz veya Play satın alma token",
    matchSteps: "Maç adımları",
    formationPreviewHint: "Formasyon önizleme — savaşı başlat ve arenada animasyon başlasın.",
    scrubAfterBattleHint:
      "Savaş canlı oynatılır. İstediğin anı zaman çubuğundan tekrar izle, ya da sona atla.",
    mirrorB: "Yansıma (B)",
    opponentB: "Rakip (B)",
    frontL: "Ön Sol",
    frontR: "Ön Sağ",
    backL: "Arka Sol",
    backR: "Arka Sağ",
    emptySlot: "— boş —",
    ownedLabel: "Sahip olunan:",
    equippedLabel: "Donatılmış:",
    noneOwned: "yok",
    equipDefaults: "varsayılan",
    levelShort: "Sv {{level}}",
    seasonEndsOn: "{{date}} sona erer",
    slotFrame: "Çerçeve",
    slotArena: "Arena",
    slotTitle: "Unvan",
    equippedSlotTitle: "Donatılmış {{slot}}"
  },
  match: {
    step1Prepare: "1 · Hazırlık",
    step2Fight: "2 · Savaş",
    step3Result: "3 · Sonuç",
    victory: "Zafer",
    defeat: "Yenilgi",
    draw: "Berabere"
  },
  questsUi: {
    claimed: "Alındı",
    claim: "Al",
    freeOk: "Ücretsiz ✓",
    claimFree: "Ücretsiz al",
    premOk: "Premium ✓",
    claimPremium: "Premium al"
  },
  quests: {
    q_daily_claim: "Günlük ödülü al",
    q_daily_submit: "Günlük lider tablosuna gönder",
    q_weekly_lb: "Günlük lider tablosu gönderimleri (5×)",
    q_weekly_shop: "Günlük mağazadan satın al (3×)"
  },
  synergies: {
    activeLabel: "Aktif sinerjiler",
    appliedLabel: "Uygulanan sinerjiler",
    frontline_2: "Ön Cephe (2)",
    frontline_3: "Ön Cephe (3)",
    frontline_4: "Ön Cephe (4)",
    assault_2: "Saldırı (2)",
    assault_3: "Saldırı (3)",
    assault_4: "Saldırı (4)",
    backline_2: "Arka Cephe (2)",
    backline_3: "Arka Cephe (3)",
    backline_4: "Arka Cephe (4)",
    control_2: "Kontrol (2)",
    control_3: "Kontrol (3)",
    vanguard_2: "Öncü (2)",
    vanguard_3: "Öncü (3)",
    vanguard_4: "Öncü (4)",
    marauder_2: "Çapulcu (2)",
    marauder_3: "Çapulcu (3)",
    marauder_4: "Çapulcu (4)",
    arcane_2: "Gizem (2)",
    arcane_3: "Gizem (3)",
    arcane_4: "Gizem (4)",
    ranger_2: "Avcı (2)",
    ranger_3: "Avcı (3)",
    ranger_4: "Avcı (4)",
    order_2: "Tarikat (2)",
    order_3: "Tarikat (3)",
    order_4: "Tarikat (4)"
  },
  cosmetics: {
    cos_frame_nyrvexis_v1: "Nyrvexis çerçevesi",
    cos_arena_twilight_v1: "Alacakaranlık arena tonu",
    cos_title_vanguard_v1: "Öncü unvanı",
    hub_starter_beacon: "Çekirdek beacon",
    hub_twilight_spire: "Alacakaranlık kulesi",
    hub_signal_array: "Sinyal dizisi"
  },
  iapUi: {
    working: "İşleniyor…",
    purchaseOnDevice: "Cihazda satın al",
    verifying: "Doğrulanıyor…",
    verifyAndUnlockPremium: "Doğrula ve premium aç",
    enablePushOnThisDevice: "Bu cihazda bildirimi aç"
  },
  pushNotes: {
    notSupported: "Bu tarayıcı bildirimi desteklemiyor.",
    payloadIncomplete: "Abonelik bilgisi eksik.",
    subscribed: "Abone olundu. Sunucu günlük hatırlatmaları gönderebilir (yönetici/cron).",
    keysMissing: "Sunucuda KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY ayarlanana kadar bildirim kapalı.",
    optional: "Bildirim: opsiyonel — açmak için sunucuda VAPID anahtarları ayarla."
  },
  authUi: {
    login: "Giriş",
    newAccount: "Yeni hesap",
    linkGuestToEmail: "Misafiri e-postaya bağla",
    linkGoogleToGuest: "Google'ı bu misafire bağla (One Tap)",
    signOutBtn: "Çıkış yap",
    newAccountHint: "Yeni hesap, sıfırdan bir profille başlar. Bağla seçeneği bu oturumun envanterini e-postanda korur.",
    googleSetupHint: "Google ile giriş için sunucuda aynı Web Client ID ile KR_GOOGLE_CLIENT_ID ayarlanmalıdır.",
    googleOptionalHint: "Opsiyonel: web'de Google Sign-In için VITE_GOOGLE_CLIENT_ID ekleyin."
  },
  notes: {
    dismiss: "Kapat",
    home: "Ana sayfa",
    snapshotPreviewExpires: "Anlık önizleme · sona erme {{when}}",
    autoPlayDuration:
      "Otomatik oynat 1× hızında savaşı canlı akıtır — yaklaşık 60–90 saniye. 2× / 4× ile hızlandır ya da zaman çubuğundan istediğin ana dön.",
    cosmeticsUnlock: "Kozmetikler Battle Pass kademelerinden açılır (sunucu verir).",
    hubDescription:
      "Sadece kozmetik 4×4 merkez — sahip olduğun süslemeleri yerleştir. Çekirdek beacon yeni hesaplarda gelir; daha fazlası Battle Pass ile açılır.",
    buyUnlocksHint: "Satın alma, birimi 1. seviyede açar (v0).",
    checkoutRequiresIdentity:
      "Ödeme için bağlı bir kimlik (e-posta veya Google) gerekir. Misafirler bağlanmadan Stripe/IAP akışlarını açamaz.",
    shareTip:
      "İpucu: kopyalanan linki bir arkadaşına gönder. Açtığında o da küçük ödül alır, sen de küçük ödül alırsın.",
    deepLinkTip:
      "İpucu: bu sayfa URL'si isteği kodlar. Paylaş ve başkası aynı deterministik savaşı tekrar oynayabilsin.",
    premiumBpDescription:
      "Bu sezonun premium ödül hattını açar. Satın alman NYRVEXIS sunucularında doğrulanır.",
    loadingStoreListing:
      "Mağaza listesi yükleniyor… Boş kalırsa ürünün App Store Connect / Play Console'da var olduğunu ve VITE_IAP_BP_PRODUCT_* ile eşleştiğini doğrula.",
    streakLine: "Seri {{current}} (en iyi {{best}}) · BP XP {{xp}}",
    premiumUnlocked: "Premium açık",
    productionTagline: "Faz 11 • yasal/link kapısı • takım • tekrar • günlük döngü",
    hpBarsFollow:
      "HP barları kaydırıcıyı takip eder. Yeni savaşlar tick 0'dan canlı oynar — 2×/4× ile hızlandır ya da çubuktan istediğin yere git.",
    noEvents: "(olay yok)",
    pushSubscribeIntro:
      "Web Bildirim: abone olmak sunucuda bir uç nokta saklar. Operatörler yönetici veya günlük-cron gönderim tetikleyebilir.",
    seed: "tohum",
    maxTicks: "max tick",
    me: "BEN",
    guest: "misafir",
    statusOk: "BAĞLI",
    statusDown: "KAPALI"
  },
  wallet: {
    connectTronLink: "TronLink bağla",
    installTronLink: "TronLink yükle",
    connecting: "Bağlanıyor…",
    connected: "Cüzdan",
    disconnect: "Bağlantıyı kes",
    connectFailed: "Bağlantı başarısız",
    payWithUsdtg: "USDTg ile öde",
    verifyingTx: "İşlem doğrulanıyor…",
    txConfirmed: "Ödeme onaylandı",
    txFailed: "Ödeme doğrulanamadı",
    invalidTxHash: "Geçersiz işlem hash formatı",
    premiumOnVerify: "Onay sonrası premium aktif olur",
    step1OpenWallet: "TronLink ya da herhangi bir TRON cüzdanını aç.",
    step2SendTo: "Aşağıdaki treasury adresine USDTg gönder:",
    step3Amount: "Miktar",
    step4PasteTxHash: "İşlem hash'ini aşağıya yapıştır.",
    iSentIt: "Gönderdim →",
    copyAddress: "Adresi kopyala",
    txHashLabel: "İşlem hash",
    txHashHint: "Cüzdanın tx detay ekranından alınan 64 karakter hex.",
    verify: "Doğrula",
    back: "Geri"
  },
  web3: {
    poweredBy: "TRON üzerinde USDTg ile güçlendirildi",
    earnUsdtg: "Günlük top-100 oyuncu USDTg airdrop kazanır",
    web3Note: "Web sürümü USDTg cosmetic destekler. Mobil sürüm sadece fiat."
  }
};
