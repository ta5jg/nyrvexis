<!-- =============================================================================
File:           docs/PHASE10_PROGRESSION_V2.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  Faz 10 (Progression v2) teknik spesifikasyonu: quest + streak + battle pass (lite).

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## Faz 10 — Progression v2 (Quest + Streak + Battle Pass Lite)

Bu doküman Faz 10’u “ürünleştirilebilir” hale getiren teknik yüzeyi tanımlar: **veri modeli**, **gateway endpoint’leri**, **idempotency/caps**, **UI akışı**, **analytics** ve **rollback**.

> Not: Bu fazın büyük kısmı halihazırda repo içinde mevcut (protocol + gateway handler’ları + companion UI render). Bu doküman “SSOT spec” olarak referans noktasıdır.

---

## 1) İçerik modeli (Content)

### 1.1 Meta content dosyası
- Dosya: `services/gateway/src/content/catalogs/meta.v0.1.0.json`
- Şema: `packages/protocol/src/v1/meta.ts` → `KrMetaContent`

### 1.2 Alanlar
- **Economy tuning**: `economyDefaults` (`KrEconomyTuning`)
  - daily claim reward, shop/upgrade multipliers, battle pass XP knobs
- **Quests**: `quests[]` (`KrQuestDef`)
  - `scope`: `daily|weekly`
  - `track`: `daily_claim|leaderboard_submit|shop_buy`
  - `target` + `reward`
- **Battle pass tiers**: `battlePassTiers[]` (`KrBattlePassTierDef`)
  - `xpCumulative` threshold
  - `freeReward`, opsiyonel `premiumReward`

### 1.3 Sürümleme ve rollback
- `KR_META_VERSION` env ile meta/season/event dosyaları birlikte sürümlenir.
- Rollback: `KR_META_VERSION` önceki versiyona alınır + gateway reload/deploy.

---

## 2) Persist edilen state (Store)

Gateway store içinde meta state:
- Streak: `metaStreak[userId]` (`MetaStreakRow`)
- Quest progress: `metaQuests[mqKey]` (`MetaQuestRow`)
- Battle pass: `metaBp[userId:seasonId]` (`MetaBpRow`)
- BP daily XP cap: `metaBpDayXp[userId:dateUtc]`
- Idempotency: `idempotencyKeys[...]`

Handler’lar: `services/gateway/src/meta/metaHandlers.ts`

---

## 3) Gateway API yüzeyi

### 3.1 Görüntüleme
- `GET /meta/progress`
  - Auth: required (`requireAuth`)
  - Feature flag: `meta_progression`
  - Response: `KrMetaProgressResponse`
  - Hesaplama: `buildMetaProgressView(...)`

### 3.2 Quest claim
- `POST /meta/quests/claim`
  - Body: `KrMetaQuestClaimRequest` (`questId`, optional `idempotencyKey`)
  - Caps: `KR_META_QUEST_CLAIM_MAX_PER_DAY` (per-user, per-day)
  - Response: `KrMetaQuestClaimResponse` (granted + inventory snapshot)
  - Hata kodları (400): `NOT_FOUND|INCOMPLETE|CLAIMED|IDEMPOTENT|DISABLED|BAD_REQUEST`
  - Rate-limit (429): `RATE_LIMITED`

### 3.3 Battle pass tier claim
- `POST /meta/battle-pass/claim`
  - Body: `KrMetaBattlePassClaimRequest` (`tier`, `track`, optional `idempotencyKey`)
  - Caps: `KR_META_QUEST_CLAIM_MAX_PER_DAY` (şimdilik aynı cap)
  - Response: `KrMetaBattlePassClaimResponse`
  - Hatalar (400): `NOT_FOUND|INSUFFICIENT_XP|NO_PREMIUM|NO_PREMIUM_REWARD|CLAIMED|IDEMPOTENT|DISABLED|BAD_REQUEST`

### 3.4 Admin balance (Faz 11’e köprü)
- `GET /admin/balance`
- `POST /admin/balance` (`KrAdminBalanceSetRequest`)

---

## 4) Olaylar (progress bump noktaları)

### 4.1 Daily claim başarılı olunca
`onDailyClaimSuccess(...)`:
- streak touch
- quest track bump: `daily_claim`
- battle pass XP grant: `battlePassXpPerDailyClaim` (daily cap uygulanır)

### 4.2 Leaderboard submit olunca
`onLeaderboardSubmit(...)`:
- streak touch
- quest track bump: `leaderboard_submit`
- (opsiyonel) BP XP grant: `battlePassXpPerLeaderboard`

### 4.3 Shop buy olunca
`onShopBuy(...)`:
- quest track bump: `shop_buy`

---

## 5) UI (Companion Web) minimal akış

Hedef: kullanıcı her gün “hedef + ödül” görür ve 1 tıkla claim yapar.

### 5.1 Ekran parçaları
- Üst bar: streak (current/best, catch-up tokens)
- Quest list: progress + reward + claim butonu (complete ise)
- Battle pass: XP bar + claimable tiers (free/premium)

### 5.2 UX kuralları
- Claim butonları **idempotent**: double click güvenli.
- Daily/weekly ayrımı net: weekly quest’ler week key ile resetlenir.

---

## 6) Idempotency + Caps standardı

### 6.1 IdempotencyKey
- Client aynı action’ı tekrarlarsa aynı key’i gönderebilir.
- Store: `idempotencyKeys` içine `idem:*` prefix ile yazılır.

### 6.2 Caps
- Per-user per-day caps (429): abuse ve spam kontrolü.
- Metrikler: `kr_meta_quest_claim_rate_limited_total`, `kr_meta_bp_claim_rate_limited_total`

---

## 7) Analytics (ölçüm)

Minimum event seti (DB varsa `POST /analytics/event`):
- `meta_view` (progress ekranı görüntülendi)
- `quest_claim_attempt`, `quest_claim_success`, `quest_claim_fail`
- `bp_claim_attempt`, `bp_claim_success`, `bp_claim_fail`
- `streak_touch` (daily claim / leaderboard submit sonrası)

Funnel: onboarding → daily battle → claim → shop → upgrade → leaderboard submit → quest/bp claims

---

## 8) Güvenlik notları
- Quest/BP claim **server authoritative**: reward uygulaması gateway tarafında.
- Inventory update mutating store içinde yapılır.
- Premium track açma (satın alma) Faz 5/11 ile entegre edilir; `hasPremium` server-side set edilir.

---

## 9) Test plan (DoD için)
- Quest progress bump: daily claim → ilgili quest progress artar.
- Weekly quest: week boundary (UTC) geçişiyle yeni period key oluşur.
- Claim edge cases: incomplete/claimed/idem key tekrarında doğru hata.
- Battle pass XP cap: bir günde cap üstüne çıkmaz.
- Store restart: progress kaybolmaz (FileStore) / Postgres mode’da kalıcıdır.

---

## 10) Rollback planı
- Feature flag `meta_progression` kapatılabilir.
- `KR_META_VERSION` rollback ile quest/bp tabloları geri alınabilir.
- En uç durumda claim endpoint’leri “read-only” (400 DISABLED) moda alınır; ilerleme view kalır.

