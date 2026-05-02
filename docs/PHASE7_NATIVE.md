## Faz 7 — Native client (opsiyonel)

Bu fazın amacı, web-first prototip kanıtlandıktan sonra **store dağıtımı** ve **native entegrasyonlar** (push, deep-link, offline cache) ile ürünü büyütmektir.

NYRVEXIS için en düşük riskli yaklaşım:
- **PWA** (installable) = “hemen” native hissi + offline cache + hızlı iterasyon
- **Capacitor wrapper** = iOS/Android store’a giden köprü (tek web codebase)
- Unity client (opsiyonel, sonra) = gerçek 3D/animasyon + farklı UX, ama maliyetli

---

### 7.1 PWA (apps/companion-web)

PWA zaten devrede:
- `manifest.webmanifest`
- `sw.js` (workbox generateSW)
- `virtual:pwa-register` ile otomatik update

Build:

```bash
pnpm --filter @nyrvexis/companion-web build
pnpm --filter @nyrvexis/companion-web preview
```

---

### 7.2 Mobil wrapper (apps/companion-mobile)

`apps/companion-mobile` Capacitor config’i `apps/companion-web/dist` çıktısını sarar.

1) Build web

```bash
pnpm --filter @nyrvexis/companion-mobile build:web
```

2) Platform ekle (one-time)

```bash
pnpm --filter @nyrvexis/companion-mobile exec cap add ios
pnpm --filter @nyrvexis/companion-mobile exec cap add android
```

3) Sync

```bash
pnpm --filter @nyrvexis/companion-mobile exec cap sync
```

4) Open

```bash
pnpm --filter @nyrvexis/companion-mobile exec cap open ios
pnpm --filter @nyrvexis/companion-mobile exec cap open android
```

---

### 7.3 Deep link (web + Capacitor)

**Query parametreleri (companion-web):**
- `?view=battle|shop|collection|monetization|leaderboard|share|push` → ilgili karta scroll (param sonra temizlenir)
- `?run=1` (veya `true` / `yes`) → mevcut `q` battle request ile simülasyonu otomatik çalıştırır (`run` temizlenir)
- Mevcut: `?q=…` replay, `?ref=…` referral, `?ticket=…` share redeem, `?purchase=…&status=…` checkout dönüşü

**Capacitor (`@capacitor/app`):** `appUrlOpen` ile gelen HTTPS URL’nin query’si mevcut origin’e merge edilir ve `kr:urlchanged` ile aynı handler tetiklenir (ticket/referral/view/run akışları yeniden çalışır).

---

### 7.4 Web Push (MVP)

**Gateway**
- `GET /push/web/vapid-public` — VAPID yoksa `enabled: false`
- `POST /push/web/subscribe` (Bearer) — abonelik kaydı; **aynı endpoint yeniden gelirse cap tüketilmez** (idempotent upsert)
- Günlük **cap**: yeni endpoint başına en fazla **50** subscribe / gün / kullanıcı (`pushSubscribe` cap)
- `POST /admin/push/test` + `x-kr-admin-token` — test bildirimi (`KR_VAPID_*` + `KR_ADMIN_TOKEN` gerekli). İsteğe bağlı `userId` yoksa en fazla 500 hedef.

**Env (gateway):**
- `KR_VAPID_PUBLIC_KEY`, `KR_VAPID_PRIVATE_KEY` (ör. `npx web-push generate-vapid-keys`)
- `KR_PUSH_SUBJECT` (ör. `mailto:ops@example.com`)

**Feature flag:** `push_web` (`flags.json`, varsayılan açık)

**Client:** companion-web → “Push (daily reminder)” kartı → “Enable push on this device”.

### 7.5 Günlük push (cron)

`POST /internal/push/daily` — header **`x-kr-internal-cron-secret`** = `KR_INTERNAL_CRON_SECRET` (SHA-256 üzerinden `timingSafeEqual` ile karşılaştırma).

- **`KR_INTERNAL_CRON_SECRET`** yoksa: `503 CRON_DISABLED`
- Gövde (opsiyonel): `{ "v": 1, "dateUtc": "2026-04-30", "dryRun": true, "limit": 2000 }`
- **Idempotency:** her `subscriptionId` (`subId`) + `dateUtc` için en fazla **1** başarılı gönderim (`caps` anahtarı `pushDailySub:${subId}:${dateUtc}`)
- **410 Gone:** abonelik store’dan silinir (`removed` sayacı)
- **Rate limit:** `/internal/*` global IP/user limiter’dan **muaf** (cron güvenilirliği)

Örnek:

```bash
curl -sS -X POST "http://localhost:8787/internal/push/daily" \
  -H "content-type: application/json" \
  -H "x-kr-internal-cron-secret: $KR_INTERNAL_CRON_SECRET" \
  -d '{"v":1,"dryRun":true}'
```

### GitHub Actions

Workflow: `.github/workflows/nyrvexis-push-daily.yml`

Repository **Secrets**:
- `NYRVEXIS_GATEWAY_BASE_URL` — canlı gateway kökü (sonunda `/` yok), örn. `https://api.nyrvexis.example`
- `NYRVEXIS_INTERNAL_CRON_SECRET` — sunucudaki `KR_INTERNAL_CRON_SECRET` ile aynı

Manuel tetik: Actions → **NYRVEXIS daily web push** → **Run workflow** → isteğe bağlı `dry_run`.

### Prometheus

`/metrics` içinde günlük job kümülatif sayaçları:
- `kr_push_daily_scanned_total`
- `kr_push_daily_sent_total`
- `kr_push_daily_skipped_total`
- `kr_push_daily_failed_total`
- `kr_push_daily_removed_total`

