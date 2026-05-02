<!-- =============================================================================
File:           docs/PHASE12_14_SECURITY_OPS.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  Faz 12–14 için birleşik güvenlik + operasyon (anti-abuse, prod hardening, liveops) checklist ve ölçüm planı.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## Faz 12–14 — Security + Ops Hardening (Anti-abuse → Prod → LiveOps)

Bu doküman Faz 12 (anti-abuse/validation), Faz 13 (prod deploy+data) ve Faz 14 (season/liveops) çalışmalarını tek bir **release gate** mantığına bağlar.

Kaynak dokümanlar:
- Faz 13 runbook: `docs/PHASE13_PRODUCTION.md`
- Faz 14 runbook: `docs/PHASE14_SEASONS_LIVEOPS.md`
- Growth anti-abuse: `docs/PHASE4_GROWTH.md`

---

## 1) Threat model (pratik v1)

### 1.1 Başlıca saldırı yüzeyleri
- **Leaderboard abuse**: arbitrary replay, seed spoof, spam submit, score tamper
- **Reward abuse**: daily claim spam, quest/bp claim spam, referral/share self-farm
- **Payment abuse**: sahte webhook, replay attack, double-spend
- **Content abuse**: yanlış meta/season/event push, “broken economy” rollout
- **Ops**: secret sızıntısı, yanlış CORS, rate-limit misconfig, DB corruption

### 1.2 Güvenlik prensipleri
- Server authoritative: ödül/para/leaderboard skor hesapları server’da.
- Idempotency everywhere: her “grant” yapan endpoint idempotent.
- Caps + rate limit: davranış spam’ini pahalı/etkisiz yap.
- Observability: abuse sinyali metrik/log olarak görünür olmalı.

---

## 2) Faz 12 — Anti-abuse / Validation checklist

### 2.1 Leaderboard doğrulama (mevcut parçalar)
- **Official seed zorunluluğu**:
  - `services/gateway/src/security/leaderboardGuards.ts`
  - Env: `KR_LEADERBOARD_REQUIRE_OFFICIAL_SEED` (default on)
- **Nonce/ticket zorunluluğu**:
  - Env: `KR_LEADERBOARD_REQUIRE_NONCE` + TTL + issue caps
  - Hedef: blind replay submit’lerini düşürmek
- **Per-user per-day submit cap**:
  - Env: `KR_LEADERBOARD_MAX_SUBMITS_PER_DAY`

### 2.2 Reward abuse guardrails
- Daily claim attempts cap: `KR_DAILY_CLAIM_ATTEMPTS_MAX_PER_DAY`
- Share redeem cap: `KR_SHARE_REDEEM_MAX_PER_DAY`
- Meta quest/bp claim cap: `KR_META_QUEST_CLAIM_MAX_PER_DAY`
- Idempotency keys: store `idempotencyKeys[...]`

### 2.3 Payment validation
- Stripe webhook signature verify:
  - `services/gateway/src/security/stripeWebhook.ts`
  - Env: `STRIPE_WEBHOOK_SECRET`
- Dev-only bypass:
  - `KR_STRIPE_WEBHOOK_INSECURE_DEV` (prod’da **kapalı** olmalı)

### 2.4 Admin attack surface
- Admin token: `KR_ADMIN_TOKEN`
- Kurallar:
  - Prod’da admin endpoint’leri *mutlaka* token ile korunmalı
  - Audit log (kim, ne, ne zaman)

### 2.5 Test plan (anti-abuse)
- Leaderboard seed mismatch: reject + metric artışı
- Nonce yok/expired: reject + metric artışı
- Caps: 429 dönüşü + rate-limit metriği
- Idempotency: aynı key tekrarında no-op / IDEMPOTENT

### 2.6 Rollback
- Feature flag/env ile doğrulama modlarını “daha sıkı” yapabilmek (gevşetmek acil durum dışında önerilmez)
- Submit/claim endpoint’lerini geçici disable (DISABLED) moduna almak

---

## 3) Faz 13 — Prod hardening checklist (özet gate)

Detay: `docs/PHASE13_PRODUCTION.md`

### 3.1 Data & persistence
- Postgres mode: `KR_DATABASE_URL`
- Migrations: `services/gateway/migrations/*.sql`
- Backup/restore drill (tarihli)

### 3.2 Deploy & rollback
- Docker build + entrypoint migrate
- Rollback: previous image + DB restore/snapshot prosedürü

### 3.3 Observability
- `/health` (DB check dahil)
- `/metrics` (Prometheus)
- Structured logs + trace id

### 3.4 Test plan (prod)
- docker-compose up → smoke test `/health`, `/metrics`, core endpoints
- DB migration forward + (mümkünse) rollback stratejisi dokümante

---

## 4) Faz 14 — LiveOps content factory checklist

Detay: `docs/PHASE14_SEASONS_LIVEOPS.md`

### 4.1 Content gates
- `pnpm --filter @nyrvexis/gateway content:validate` **yeşil**
- Season/meta `seasonId` tutarlılığı
- Event time-window doğruluğu

### 4.2 Rollout standardı
- Canary deploy + KPI izleme (min 1–2 saat)
- Hızlı rollback: `KR_META_VERSION` geri + deploy rollback

### 4.3 Ops runbooks (minimum)
- Incident: gateway down / DB down / content bad push
- Abuse response: cap artır/azalt, endpoint disable, user quarantine
- Season rollover: yeni meta+season, validate, deploy, verify

---

## 5) KPI + ölçüm planı (Faz 12–14 gate)

### 5.1 Ürün funnel eventleri (analytics)
- onboarding_start/complete
- daily_battle_start/complete
- daily_claim_success/fail
- shop_view/buy_success/fail
- upgrade_success/fail
- leaderboard_nonce_issued
- leaderboard_submit_success/fail (seed_mismatch, nonce_invalid, rate_limited)
- quest_claim_success/fail
- bp_claim_success/fail
- season_view, event_view

### 5.2 SRE/ops metrikleri (Prometheus)
- Request volume + status code dağılımı
- Rate-limited counters (per feature)
- Stripe webhook signature ok/fail
- Analytics ingest ok/fail
- DB check health

### 5.3 Alert önerileri (minimum)
- p95 latency spike
- 5xx error rate spike
- DB check error
- rate-limited counters “sıfırdan fırladı” (abuse veya client bug)
- signature fail spike (attack veya secret mismatch)

---

## 6) Release gate: v1.0 için “go/no-go”
- [ ] Prod stack deploy + rollback pratikte denendi
- [ ] Backup/restore drill loglandı (RTO/RPO)
- [ ] Content validate pipeline release’te zorunlu
- [ ] Anti-abuse guardrails açık (official seed + nonce + caps)
- [ ] Ödeme doğrulama açık (signature verify) ve dev bypass prod’da kapalı
- [ ] Observability: dashboard + temel alertler açık

