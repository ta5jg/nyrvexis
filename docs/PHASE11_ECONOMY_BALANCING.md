<!-- =============================================================================
File:           docs/PHASE11_ECONOMY_BALANCING.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  Faz 11 teknik spesifikasyonu: economy tabloları + balancing toolchain + admin override + A/B knob planı.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## Faz 11 — Economy + Balancing Toolchain

Hedef: Economy “tahmin” değil, **tablolu + ölçülebilir + geri alınabilir** bir sistem olsun.

Bu fazın odağı:
- Economy knobs’ları **content** ile tanımlamak
- Gateway’de **override** (admin) ile güvenli tweak
- Offline **simulator** ile kaynak/sink eğrilerini görmek
- Canary/A-B planı ile değişiklikleri “kontrollü” yayımlamak

---

## 1) SSOT knobs (Content)

### 1.1 Meta economy tuning
Şema: `packages/protocol/src/v1/meta.ts` → `KrEconomyTuning`
- `dailyClaimGold|Shards|Keys`
- `shopGoldMulPct`
- `upgradeGoldMulPct`, `upgradeShardMulPct`
- `battlePassXpPerDailyClaim`, `battlePassXpPerLeaderboard`, `battlePassXpDailyCap`

Kaynak dosya örneği: `services/gateway/src/content/catalogs/meta.v0.1.0.json` (`economyDefaults`)

### 1.2 Fiyat fonksiyonları (deterministik)
- Shop rotation + fiyat: `services/gateway/src/meta/shop.ts`
  - `makeDailyOffers(..., shopGoldMulPct)`
- Upgrade cost: `services/gateway/src/meta/shop.ts`
  - `upgradeCost(level, upgradeGoldMulPct, upgradeShardMulPct)`

> Kural: Economy hesapları deterministik olmalı; seed + date + userId ile stable olmalı.

---

## 2) Admin override (v1)

### 2.1 Storage modeli
Şimdiki uygulama (lokal/dev):
- Dosya: `services/gateway/src/meta/balanceFile.ts`
- Override file: `<KR_STORE_DIR>/balance.json`
- Parse: `KrEconomyTuning.partial()`

Prod önerisi:
- Postgres mode’da override’ın da DB’de saklanması (audit log ile).
- En düşük riskli yaklaşım: aynı JSON patch’i `gateway_state` içinde saklamak.

### 2.2 API yüzeyi
`services/gateway/src/index.ts`:
- `GET /admin/balance` → `KrAdminBalanceGetResponse`
  - `override` (partial) + `effective` (defaults+override)
- `POST /admin/balance` → `KrAdminBalanceSetRequest` → `KrAdminBalanceSetResponse`
  - Input: `patch` (partial) + optional `idempotencyKey`

### 2.3 Güvenlik
- Admin auth: prod’da ayrı token/role (mevcut admin middleware/pattern ile).
- Audit: kim değiştirdi, neyi değiştirdi, ne zaman (log + DB table).

---

## 3) Economy simulator (offline tool)

Amaç: “1 parametreyi değiştirince 30 günlük eğri ne oluyor?” sorusuna hızlı cevap.

### 3.1 Önerilen araç
- Script: `services/gateway/scripts/economy-sim.ts` (öneri)
- Girdi:
  - meta content (`meta.<ver>.json`)
  - unit catalog (`units.<ver>.json`)
  - başlangıç inventory varsayımları
  - davranış modeli (basit): günde kaç battle, kaç shop buy, kaç upgrade
- Çıktı:
  - 7/30 gün sonunda currency dağılımı
  - upgrade curve (ortalama level)
  - battle pass tier progress (xp)

### 3.2 Minimal sim modeli (v1)
- Daily claim her gün 1×
- Shop buy: günde 0–1× (p=0.35 gibi)
- Upgrade: gold>cost ise 1×
- Leaderboard submit: günde 0–1× (p=0.45 gibi)

> Bu sim “gerçek kullanıcı” değildir; sadece knob’ların yönünü görmek içindir.

---

## 4) A/B knob planı (v1)

Değişiklikleri az sayıda “ana knob” ile kontrollü yap.

### 4.1 Başlangıçta 2–3 knob
- `dailyClaimGold` (source)
- `upgradeGoldMulPct` (sink)
- `shopGoldMulPct` (sink)

### 4.2 Segmentasyon
- `userId` hash ile stable bucketing (50/50) veya feature flag provider.
- Bucket değişmemeli (aynı kullanıcı aynı bucket).

### 4.3 Ölçüm
- Funnel: claim → shop → upgrade → leaderboard submit
- Inflation: 7/30 gün sonunda gold/shard medyanı

---

## 5) Rollout & rollback standardı

### 5.1 Rollout
- Canary: %5 → %25 → %50 → %100 (24–48 saat penceresi)
- Alerts: p95 latency, error rate, claim/shop/upgrade success rates

### 5.2 Rollback
- Admin override revert (patch temizle)
- Content version rollback (`KR_META_VERSION`)
- Deploy rollback (gateway/web)

---

## 6) Exit criteria (Faz 11)
- Economy knobs content’te ve override ile yönetilebilir.
- Simulator ile 30 gün sim raporu alınabiliyor.
- En az 1 knob değişikliği canary + rollback ile denenmiş.

---

## Not: Premium Pass (Battle Pass entitlement)
- Offer: `premium_pass_v1` (`GET /offers`)
- Checkout: `POST /checkout/create` (devstub: anında fulfill; Stripe: webhook ile fulfill)
- Fulfillment: `grantOfferToUser(...)` premium offer için ilgili sezon `metaBp.hasPremium=true` yapar

