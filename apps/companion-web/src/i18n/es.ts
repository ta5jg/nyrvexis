import type { Translations } from "./en";

export const es: Translations = {
  app: {
    brand: "NYRVEXIS",
    tagline: "Batallas tácticas de escuadrón asíncronas — web y móvil.",
    sameClientNote: "El mismo cliente funciona en la web y en las tiendas (Capacitor)."
  },
  home: {
    enterBattle: "Entrar a la batalla",
    panelsHint: "Los paneles de progresión, tienda y meta se cargan al entrar.",
    gatewayLabel: "Servidor:",
    statusChecking: "Comprobando…",
    statusConnected: "Conectado",
    statusUnavailable: "No disponible"
  },
  legal: {
    privacy: "Privacidad",
    terms: "Términos",
    support: "Soporte",
    accountAndData: "Cuenta y datos",
    storeDisclosure: "Notas de divulgación de la tienda",
    sectionLabel: "Legal y soporte"
  },
  language: {
    label: "Idioma",
    en: "English",
    tr: "Türkçe",
    es: "Español",
    de: "Deutsch"
  },
  section: {
    user: "USUARIO",
    arena: "Arena",
    battle: "Batalla",
    result: "Resultado",
    seasonMeta: "Temporada y meta",
    cosmetics: "Cosméticos",
    yourPlanet: "Tu planeta",
    shopDaily: "Tienda (diaria)",
    collection: "Colección",
    monetization: "Monetización (MVP)",
    purchaseStatus: "Estado de la compra",
    dailyLeaderboard: "Clasificación diaria",
    shareRewards: "Recompensas por compartir",
    push: "Notificaciones (recordatorio diario)"
  },
  auth: {
    email: "Correo",
    password: "Contraseña",
    register: "Registrarse",
    signIn: "Iniciar sesión",
    signOut: "Cerrar sesión",
    linkAccount: "Vincular cuenta",
    googleSignIn: "Iniciar sesión con Google"
  },
  battle: {
    runBattle: "Iniciar batalla",
    dailyBattle: "Batalla diaria",
    yourSquad: "Tu escuadrón",
    yourSquadA: "Tu escuadrón (A)",
    enemy: "Enemigo",
    formationA: "Formación A (0–5 frente, 6–11 atrás)",
    formationB: "Formación B",
    pickFourHint: "Elige cuatro casillas, selecciona un preajuste de oponente, luego Iniciar batalla o Batalla diaria.",
    enemyDemo: "Equipo demo (RIFT)",
    enemyMirror: "Reflejar tu escuadrón",
    ssotJsonLabel: "SSOT JSON (avanzado)",
    youPlaySideA: "Juegas en el lado A · El oponente está en el B"
  },
  replay: {
    title: "Repetición",
    speed: "Velocidad",
    autoPlay: "Reproducción automática",
    autoPlayHint: "Reproducción automática desde tu posición actual.",
    keyboardHint: "Teclado: ← → desplazar · Home End ir al inicio/final · Espacio reproducir/pausar"
  },
  meta: {
    quests: "Misiones",
    battlePassTiers: "Niveles del Battle Pass",
    premiumBattlePass: "Battle Pass Premium (App Store / Play)",
    seasonInfoUnavailable: "Información de temporada no disponible.",
    metaProgressAfterSignIn: "El progreso meta carga al iniciar sesión.",
    cosmeticsAfterSignIn: "Inicia sesión para cargar los cosméticos.",
    planetAfterSignIn: "Inicia sesión para cargar tu planeta.",
    noUnitsYet: "Aún no hay unidades. Compra en la tienda.",
    loadingOffers: "Cargando ofertas…",
    balancesNote: "Los saldos se actualizan al instante."
  },
  iap: {
    qaPanelTitle: "IAP → BP Premium (QA)",
    platform: "Plataforma",
    productId: "ID de producto",
    receiptOrToken: "Recibo / token de compra"
  },
  onboarding: {
    welcome: "Bienvenido a NYRVEXIS",
    stepBuildSquad: "Arma tu escuadrón (4 casillas).",
    stepRunBattle: "Pulsa Batalla diaria (necesita el servidor OK) o Iniciar batalla.",
    stepAutoPlay: "Pulsa Reproducción automática para ver desde tu posición hasta el final.",
    stepMissNote: "Etiqueta MISS — los números de daño quedan en rojo/dorado para los aciertos."
  },
  share: {
    sharedPlanet: "Planeta compartido"
  },
  errors: {
    unknown: "Error desconocido",
    signInFailed: "Inicio de sesión fallido",
    registerFailed: "Registro fallido",
    loginFailed: "Inicio de sesión fallido",
    linkFailed: "Vinculación fallida",
    signOutFailed: "Cierre de sesión fallido",
    googleSignInFailed: "Inicio de sesión con Google fallido",
    pushFailed: "Notificación fallida.",
    planetShareFailed: "Compartición de planeta fallida.",
    googleOneTapUnavailable: "Google One Tap no disponible en este navegador.",
    guestIapBlocked:
      "Vincula correo/Google o regístrate antes de pagar — las compras con dinero real deben asociarse a una cuenta restaurable (IAP de invitado bloqueada)."
  },
  ui: {
    sound: "Sonido",
    retry: "Reintentar",
    dismiss: "Descartar",
    home: "Inicio",
    reconnect: "Reconectar",
    claimDaily: "Reclamar diario",
    refresh: "Refrescar",
    account: "Cuenta",
    hide: "Ocultar",
    show: "Mostrar",
    advancedJsonSuffix: "JSON avanzado",
    copyShareLink: "Copiar enlace de compartir",
    copySocialText: "Copiar texto social",
    exportPng: "Exportar PNG",
    exportUnityJson: "Exportar Unity JSON",
    shareToX: "Compartir en X",
    tutorialSeed: "Semilla de tutorial",
    newDemo: "Nuevo demo",
    replayFromStart: "Reproducir desde el inicio",
    jumpToEnd: "Saltar al final",
    battleAgain: "Batallar de nuevo",
    battlePassAndQuests: "Battle Pass y misiones",
    copyPlanetLink: "Copiar enlace del planeta",
    exportPlanetPng: "Exportar PNG del planeta",
    buy: "Comprar",
    upgrade: "Mejorar",
    refreshPurchaseStatus: "Refrescar estado de compra",
    refreshLeaderboard: "Refrescar clasificación",
    playDailyAndSubmit: "Jugar diario + enviar",
    createShareTicket: "Crear ticket compartible (copiar enlace)",
    start: "Iniciar",
    tutorialBattle: "Batalla tutorial",
    runABattleToSeeOutput: "Inicia una batalla para ver la salida.",
    simulating: "Simulando…",
    noEntriesYet: "Aún no hay entradas.",
    developmentBuild: "Compilación de desarrollo",
    productionBuild: "Compilación de producción",
    retryGatewayHealthCheck: "Reintentar comprobación del servidor",
    storeProductSku: "SKU del producto en tienda",
    base64ReceiptOrToken: "Recibo Base64 o token de compra de Play",
    matchSteps: "Pasos de la partida",
    formationPreviewHint: "Vista previa de formación — inicia una batalla para animar el combate.",
    scrubAfterBattleHint:
      "La batalla se reproduce en vivo. Usa la línea de tiempo para revivir un momento o salta al resultado.",
    mirrorB: "Espejo (B)",
    opponentB: "Oponente (B)",
    frontL: "Frente Izq.",
    frontR: "Frente Der.",
    backL: "Atrás Izq.",
    backR: "Atrás Der.",
    emptySlot: "— vacío —",
    ownedLabel: "Poseído:",
    equippedLabel: "Equipado:",
    noneOwned: "ninguno",
    equipDefaults: "predeterminado",
    levelShort: "Nv {{level}}",
    seasonEndsOn: "termina el {{date}}",
    slotFrame: "Marco",
    slotArena: "Arena",
    slotTitle: "Título",
    equippedSlotTitle: "Equipado {{slot}}"
  },
  match: {
    step1Prepare: "1 · Preparar",
    step2Fight: "2 · Combatir",
    step3Result: "3 · Resultado",
    victory: "Victoria",
    defeat: "Derrota",
    draw: "Empate"
  },
  questsUi: {
    claimed: "Reclamado",
    claim: "Reclamar",
    freeOk: "Gratis ✓",
    claimFree: "Reclamar gratis",
    premOk: "Premium ✓",
    claimPremium: "Reclamar premium"
  },
  quests: {
    q_daily_claim: "Reclama recompensa diaria",
    q_daily_submit: "Envía a la clasificación diaria",
    q_weekly_lb: "Envíos a clasificación diaria (5×)",
    q_weekly_shop: "Compra en la tienda diaria (3×)"
  },
  synergies: {
    activeLabel: "Sinergias activas",
    appliedLabel: "Sinergias aplicadas",
    frontline_2: "Vanguardia (2)",
    frontline_3: "Vanguardia (3)",
    frontline_4: "Vanguardia (4)",
    assault_2: "Asalto (2)",
    assault_3: "Asalto (3)",
    assault_4: "Asalto (4)",
    backline_2: "Retaguardia (2)",
    backline_3: "Retaguardia (3)",
    backline_4: "Retaguardia (4)",
    control_2: "Control (2)",
    control_3: "Control (3)",
    vanguard_2: "Vanguardia (2)",
    vanguard_3: "Vanguardia (3)",
    vanguard_4: "Vanguardia (4)",
    marauder_2: "Saqueador (2)",
    marauder_3: "Saqueador (3)",
    marauder_4: "Saqueador (4)",
    arcane_2: "Arcano (2)",
    arcane_3: "Arcano (3)",
    arcane_4: "Arcano (4)",
    ranger_2: "Cazador (2)",
    ranger_3: "Cazador (3)",
    ranger_4: "Cazador (4)",
    order_2: "Orden (2)",
    order_3: "Orden (3)",
    order_4: "Orden (4)"
  },
  cosmetics: {
    cos_frame_nyrvexis_v1: "Marco Nyrvexis",
    cos_arena_twilight_v1: "Tinte de arena crepuscular",
    cos_title_vanguard_v1: "Título Vanguardia",
    hub_starter_beacon: "Baliza central",
    hub_twilight_spire: "Aguja crepuscular",
    hub_signal_array: "Matriz de señales"
  },
  iapUi: {
    working: "Procesando…",
    purchaseOnDevice: "Comprar en el dispositivo",
    verifying: "Verificando…",
    verifyAndUnlockPremium: "Verificar y desbloquear premium",
    enablePushOnThisDevice: "Activar notificaciones en este dispositivo"
  },
  pushNotes: {
    notSupported: "Notificaciones no soportadas en este navegador.",
    payloadIncomplete: "Carga de suscripción incompleta.",
    subscribed: "Suscrito. El servidor puede enviar recordatorios diarios (admin/cron).",
    keysMissing: "Las notificaciones están apagadas hasta que el servidor tenga KR_VAPID_PUBLIC_KEY + KR_VAPID_PRIVATE_KEY.",
    optional: "Notificaciones: opcional — configura las claves VAPID en el servidor para activarlas."
  },
  authUi: {
    login: "Iniciar sesión",
    newAccount: "Nueva cuenta",
    linkGuestToEmail: "Vincular invitado → correo",
    linkGoogleToGuest: "Vincular Google a este invitado (One Tap)",
    signOutBtn: "Cerrar sesión",
    newAccountHint: "Nueva cuenta inicia un perfil limpio. Vincular conserva el inventario de esta sesión en tu correo.",
    googleSetupHint: "Iniciar sesión con Google requiere KR_GOOGLE_CLIENT_ID configurado en el servidor con el mismo Web Client ID.",
    googleOptionalHint: "Opcional: añade VITE_GOOGLE_CLIENT_ID para iniciar sesión con Google en la web."
  },
  notes: {
    dismiss: "Descartar",
    home: "Inicio",
    snapshotPreviewExpires: "Vista previa · caduca {{when}}",
    autoPlayDuration:
      "Reproducción automática a 1× transmite la batalla en vivo — unos 60–90 segundos. Usa 2× / 4× para acelerar.",
    cosmeticsUnlock: "Los cosméticos se desbloquean en niveles del Battle Pass (otorgados por el servidor).",
    hubDescription:
      "Hub cosmético 4×4 — coloca decoraciones que tengas. La baliza central viene en cuentas nuevas; otras se desbloquean con el Battle Pass.",
    buyUnlocksHint: "Comprar desbloquea una unidad al nivel 1 (v0).",
    checkoutRequiresIdentity:
      "El pago requiere identidad vinculada (correo o Google). Los invitados no pueden abrir flujos Stripe/IAP hasta iniciar sesión.",
    shareTip:
      "Consejo: envía el enlace copiado a un amigo. Cuando lo abra, él recibe una pequeña recompensa y tú también.",
    deepLinkTip:
      "Consejo: la URL de esta página codifica la solicitud. Compártela y cualquiera puede repetir la misma batalla determinista.",
    premiumBpDescription:
      "Desbloquea el camino de recompensas premium para esta temporada. Tu compra se verifica en los servidores de NYRVEXIS.",
    loadingStoreListing:
      "Cargando ficha de tienda… Si sigue vacío, confirma que el producto existe en App Store Connect / Play Console y coincide con VITE_IAP_BP_PRODUCT_*.",
    streakLine: "Racha {{current}} (mejor {{best}}) · BP XP {{xp}}",
    premiumUnlocked: "Premium desbloqueado",
    productionTagline: "Fase 11 • puerta legal/enlaces • escuadrón • repetición • bucle diario",
    hpBarsFollow:
      "Las barras de HP siguen al control. Las batallas nuevas se reproducen desde el tick 0 — usa 2×/4× para acelerar o desplaza la línea de tiempo.",
    noEvents: "(sin eventos)",
    pushSubscribeIntro:
      "Web Push: suscribirse guarda un endpoint en el servidor. Operadores pueden disparar envíos admin o por cron diario.",
    seed: "semilla",
    maxTicks: "máx. ticks",
    me: "YO",
    guest: "invitado",
    statusOk: "OK",
    statusDown: "CAÍDO"
  },
  wallet: {
    connectTronLink: "Conectar TronLink",
    installTronLink: "Instalar TronLink",
    connecting: "Conectando…",
    connected: "Cartera",
    disconnect: "Desconectar",
    connectFailed: "Conexión fallida",
    payWithUsdtg: "Pagar con USDTg",
    verifyingTx: "Verificando transacción…",
    txConfirmed: "Pago confirmado",
    txFailed: "Verificación de pago fallida",
    invalidTxHash: "Formato de hash inválido",
    premiumOnVerify: "Premium se activa al confirmar",
    step1OpenWallet: "Abre TronLink o cualquier cartera TRON.",
    step2SendTo: "Envía USDTg a esta dirección de tesorería:",
    step3Amount: "Cantidad",
    step4PasteTxHash: "Pega el hash de la transacción abajo.",
    iSentIt: "Lo envié →",
    copyAddress: "Copiar dirección",
    txHashLabel: "Hash de transacción",
    txHashHint: "Cadena hex de 64 caracteres del detalle de tx en tu cartera.",
    verify: "Verificar",
    back: "Atrás"
  },
  web3: {
    poweredBy: "Potenciado por USDTg en TRON",
    earnUsdtg: "Los top-100 diarios ganan airdrops de USDTg",
    web3Note: "La versión web soporta cosméticos USDTg. La móvil es solo fiat."
  }
};
