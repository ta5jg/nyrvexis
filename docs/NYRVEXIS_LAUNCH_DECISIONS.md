<!-- =============================================================================
File:           docs/NYRVEXIS_LAUNCH_DECISIONS.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-02
Last Update:    2026-05-02
Version:        1.0.0

Description:
  Nyrvexis yayın kararları (SSOT). Bundle ID, hosting, diller, ödeme,
  closed beta ve görsel öncelikler için tek nokta referans.
============================================================================= -->

# Nyrvexis — Yayın Kararları (SSOT)

Bu dosya yayın öncesi sabitlenen kararları tutar. Diğer dokümanlar bu kararları **referans alır**, kendi başına karar üretmez.

---

## 1. Marka ve kimlik

| Alan | Değer |
|---|---|
| Ürün adı | **Nyrvexis** |
| Üretici | USDTG GROUP TECHNOLOGY LLC |
| Bundle / App ID | **`com.usdtgverse.nyrvexis`** (iOS + Android aynı) |
| Web origin | `app.nyrvexis.com` (planlı), API: `api.nyrvexis.com` (planlı) |

**Mağaza isim rezervasyonu:** App Store Connect ve Play Console'da app oluşturulup `Nyrvexis` adı en erken bu hafta içinde alınmalı. Adın boş olduğu doğrulanmadan diğer adımlar devam etmemeli.

---

## 2. Hosting

**Karar:** Aşamalı.

| Aşama | Sağlayıcı | Aylık | Gerekçe |
|---|---|---|---|
| MVP / closed beta | **Fly.io free tier + Neon free PG** | €0 | Risk yok, dakikalar içinde deploy. |
| Public launch | **Netcup VPS 200 G11** (3 vCPU / 4 GB RAM / 80 GB NVMe, AB) | **€3.49** | Hetzner CPX11'den ucuz, daha çok kaynak. |
| Stabilite katmanı (DAU > 5k) | **Hetzner CPX21** (3 vCPU / 4 GB / 80 GB NVMe) | €7.49 | Daha iyi network + dashboard ergonomisi. |

**Migrasyon stratejisi:** `deploy/docker-compose.yml` portable. Sağlayıcı geçişi 1 saat: image pull + Postgres dump/restore + DNS swap.

**Yedekleme:** `deploy/scripts/backup-postgres.sh` günlük cron, hafta tutulur. Aylık restore drill (staging DB'ye `gunzip -c | psql`).

---

## 3. Dil desteği (i18n)

**Launch dilleri (4):** `en`, `tr`, `es`, `de`.
**Faz 2 dilleri:** `ar`, `pt-BR`, `ru`, `fr`, `ja` (DAU traction sonrası).

**Teknik gereksinim (henüz uygulanmadı, görev olarak ekle):**

- Companion-web'e hafif i18n katmanı (`react-i18next` veya kendi `t(key)` helper'ı).
- String'ler `apps/companion-web/src/i18n/{en,tr,es,de}.json` altında.
- Mağaza listing string'leri ayrı: `artifacts/store-listing/locales/{en,tr,es,de}.json`.
- Date/number format: `Intl.DateTimeFormat` + `Intl.NumberFormat` (locale dinamik).
- RTL desteği faz 2'de Arapça eklendiğinde devreye girer.

---

## 4. Ödeme modeli

**Karar:** İki kanal paralel.

| Kanal | Platform | SKU örneği |
|---|---|---|
| Mağaza IAP | iOS (StoreKit), Android (Play Billing) | `nyrvexis_bp_premium_s0_ios`, `nyrvexis_bp_premium_s0_android` |
| Stripe Checkout | Web | `nyrvexis_bp_premium_s0_web` |

**Sunucu doğrulama:** Tüm ödemeler `services/gateway` üzerinde.
- iOS: Apple `verifyReceipt` (KR_APPLE_IAP_SHARED_SECRET)
- Android: Play Developer API `purchases.products.get` (KR_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_PATH)
- Web: Stripe webhook `checkout.session.completed` (HMAC SHA-256, mevcut `verifyStripeWebhookEvent`)

**Fiyat eşitliği:** Her platform aynı USD/EUR fiyat. Mağaza komisyonu (Apple/Google %30 → small business %15) marj olarak şirkete kalır; oyuncuya yansıtılmaz.

**Stripe sertifikasyonu:** Apple ve Google App Store kuralları gereği **mobil app içinden Stripe checkout açılamaz** (yalnız web). Mobil sadece native IAP kullanır. Web istemci Stripe + IAP'tan birini sunar.

---

## 5. Closed beta

**Hedef:** Kişisel ağ + localhost test.

- **Apple TestFlight Internal Testing:** 25 kişiye kadar, App Store review gerektirmez.
- **Play Console Internal Testing:** 100 e-posta listesi, 24 saat içinde aktif.
- **Web staging:** `staging.nyrvexis.com` (Fly.io free) — IAP devre dışı, sadece akış testi.
- **Geri bildirim toplama:** Gateway `/analytics/event` zaten var. Beta build'leri `KR_SERVICE_VERSION` postfix'i ile (`0.9.0-beta.X`).

**Süre:** Minimum 7 gün soak, crash-free %99.5+ hedefi.

---

## 6. Görsel ve hareket öncelikleri

**Karar:** Karakter ve vücut hareketleri **doğal hissi** vermek zorunda.

**Tamamlandı (bu sürüm):**

- `NyrvexisAnimationSystem.ts` 12 animasyon prensibine göre yenilendi:
  - **Idle:** nefes alma (subtle scale.y/x oscillation) + ID-deterministik mikro-glance.
  - **Attack:** 3 fazlı (anticipation → strike with overshoot → spring recovery).
  - **Hit:** 3 fazlı (impulse → recoil + tilt → damped recovery + tilt residue).
  - **Move:** ark trajektori + body lean + landing squash.
  - **Skill:** charge → release pop → spring settle (renkli geçiş).
  - **Die:** stagger (jitter) → buckle (knee bend) → topple.
- **Per-archetype motion profile:** brute (ağır/yavaş), rogue (snappy), archer (steady), soldier (planted), mage (charged), support (calm).
- **Spring physics + cubic eases** (`easeOutBack`, `springReturn`, `easeInOutCubic`) helper'ları → unit test'li (14 test).

**Yapılacak (faz 2 polish):**

- Gölge alttan: hareket sırasında gölgenin yumuşaması/sertleşmesi.
- Foot-plant ipucu: alt kenarda kısa toz parçacığı (move/landing).
- Damage number "kick" easing (büyüklük → küçülme + opacity).
- Sound design: attack/hit/death için per-archetype 1-2 saniyelik SFX (mevcut `audio.ts` placeholder'a bağla).

---

## 7. Mağaza vitrin asset'leri

**Karar:** İlk wave'de hepsi statik render (Pixi'den ekran görüntüsü), professional grafik faz 2.

| Asset | Boyut | Kaynak |
|---|---|---|
| App icon (master) | 1024×1024 PNG | Tek seferlik tasarım, `@capacitor/assets` ile türev |
| iOS screenshot | 1290×2796 (6.7"), 1242×2688 (6.5") × 5 adet | `pnpm run play:local` + DevTools mobile emulator + ekran görüntüsü |
| Android screenshot | 1080×1920 telefon × 5 + 1200×1920 tablet × 3 | Aynı |
| Featured graphic (Play) | 1024×500 | Pixi arenadan composite |
| Promo video | 30s | Faz 2 |

Şablon: `artifacts/store-listing/TEMPLATE_store_listing.v1.json` doldurulup yerelleştirilir.

---

## 8. Yasal + uyum

**Karar:** Termly veya iubenda free tier ile MVP, hukuk danışmanı faz 2 (gelir sonrası).

| Belge | URL planı |
|---|---|
| Privacy Policy | `https://nyrvexis.com/privacy` |
| Terms of Service | `https://nyrvexis.com/terms` |
| Account Deletion | `https://nyrvexis.com/account-data` |
| Support email | `support@nyrvexis.com` |

**Gateway env doldurulacak:** `KR_LEGAL_*` (zaten endpoint hazır).

**İçerik beyanı:** "Animated combat, no gambling, no random paid loot, no real-money chance mechanics." → `KR_LEGAL_CONTENT_DESCRIPTORS`.

**Apple Privacy Manifest:** iOS 17+ için `PrivacyInfo.xcprivacy` — `NSPrivacyAccessedAPITypes` boş tutulur (UserDefaults kullanılmıyor; secure storage Capacitor pluginleri tarafından yönetilir).

**GDPR / KVKK:** AB veri konumu (Netcup/Hetzner Almanya), yedek de AB'de.

---

## 9. Operasyonel kararlar

| Konu | Karar |
|---|---|
| CI sağlayıcı | GitHub Actions (mevcut `nyrvexis-ci.yml`) |
| Crash reporting | **Sentry free tier** (5K hata/ay) — companion-web + gateway |
| Log aggregation | **Better Stack** veya **Axiom** free tier |
| Uptime monitor | **Uptime Kuma** (self-hosted) veya UptimeRobot free |
| Alert kanalı | Discord webhook → kişisel sunucu |
| Secrets manager | İlk faz: `.env` host filesystem (chmod 600). Faz 2: 1Password CLI veya Doppler. |

---

## 10. Karar verilmesi gereken (henüz açık)

- [ ] `nyrvexis.com` domain sahipliği — alındı mı?
- [ ] Apple Developer Program (US$99/yıl) hesabı USDTG adına mı bireysel mi?
- [ ] Play Console (US$25 tek seferlik) hesabı USDTG adına mı bireysel mi?
- [ ] Sezon 0 başlangıç tarihi (yayın günü mü, sonra mı?)
- [ ] Closed beta tester havuzu listesi (en az 10 e-posta hazır olmalı)

---

## Değişiklik günlüğü

- **2026-05-02 — v1.0.0:** İlk kararlar. Bundle ID, hosting (Fly→Netcup→Hetzner aşamalı), diller (en/tr/es/de), ödeme (IAP+Stripe), beta (kişisel ağ), animasyon doğal hareket prensiplerine yenilendi.
