<!-- =============================================================================
File:           docs/FULL_GAME_ROADMAP_V1.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-05-02
Version:        0.3.1

Description:
  NYRVEXIS’in web-first “tam oyun” (v1.0) seviyesine çıkması için uçtan uca roadmap.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## NYRVEXIS — Web-First Full Game Roadmap (v1 → v1.0)

Bu doküman `docs/ROADMAP.md` (Faz 0–7) ve `docs/ROADMAP_V1_FULL.md` (Faz 8–14) içeriklerini **tek bir v1.0 hedef çizgisine** indirger ve her faz için **deliverable + exit criteria + test plan + rollback** çerçevesi verir.

### v1.0 Tanımı (oyuncu “tam oyun” der)
- Web client “tool” değil: **ikonlar, arena, animasyon/VFX, anlaşılır karar anları**.
- **Sunum çubuğu:** gateway replay SSOT; web’de sürekli okunur hareket ve manevra hissi (`ArenaCanvas`); Unity paketinde aynı export ile **Idle / Advance / Attack / Hit / Death** içerik borusu (`docs/FULL_PRODUCT_PARITY_ROADMAP.md` R10).
- “Daily run” ile başlar; **quest/streak/battle pass/season/event** döngüsüyle haftalarca retention.
- Content sürümlenir, validate edilir, rollback edilir. Prod deploy + gözlemlenebilirlik hazırdır.

### Keskin sınırlar (determinism & güvenlik)
- **Determinism boundary**: sim sonuçları aynı input+seed ile aynı çıkmalı (client + gateway).
- **Ödül/para** girince anti-abuse sertleşir (idempotency + caps + server-side validation path).

---

## Faz 0 — Ürün Tanımı + North Star
- Kaynak: `docs/PHASE0_PRODUCT.md`

### Deliverables
- Core loop + meta loop + monetization + anti-abuse sınırı yazılı.
- KPI sözlüğü sabit.

### Exit criteria
- Faz 1 backlog’u net ve uygulanabilir.

### Test plan
- N/A (dokümantasyon doğruluğu + ekip hizası).

### Rollback
- N/A

---

## Faz 1 — Vertical Slice (oynanır + paylaşılır)
- Kaynak: `docs/ROADMAP.md`

### Deliverables
- Deterministik sim + replay.
- Web client battle setup + replay viewer + share.
- Gateway: `health`, `daily-seed`, `sim/battle`.
- İsteğe bağlı: battle export JSON → Unity golden sahne doğrulaması (`pnpm run unity:golden-export`).

### Exit criteria
- Yeni kullanıcı < 2 dk’da daily run + share yapabiliyor.

### Test plan
- Aynı request’i 10 kez çalıştır → aynı sonuç/event stream.
- Share link aç → aynı seed+setup ile tekrar oynanır.

### Rollback
- Deploy rollback (statik web) + gateway image rollback.

---

## Faz 2 — Hesap + Envanter (MVP ekonomi)
- Kaynak: `docs/ROADMAP.md`

### Deliverables
- Guest auth, inventory, daily claim.
- Persistence: FileStore (lokal) + Postgres (prod önerisi).

### Exit criteria
- Kullanıcı ilerlemesi kalıcı; daily claim idempotent.

### Test plan
- Aynı gün claim 2× → ikinci deneme değişiklik yapmaz.
- Token/guest akışı: yeni cihaz → yeni user; aynı cihaz → aynı user.

### Rollback
- DB restore + deployment rollback.

---

## Faz 3 — Meta: Koleksiyon + Progression
- Kaynak: `docs/ROADMAP.md`

### Deliverables
- Shop rotation (deterministic) + pricing tables.
- Upgrade/level ve sink/source dengesi.
- Content versioning/rollback prosedürü.

### Exit criteria
- 7 gün içinde “güçlenme” hissi ölçülür (unit level artışı).

### Test plan
- Shop rotation determinism: aynı gün/saat aynı teklifler.
- Upgrade maliyetleri: negatif currency olamaz.

### Rollback
- Content version rollback + deploy rollback.

---

## Faz 4 — Growth Loop (viral + retention)
- Kaynak: `docs/PHASE4_GROWTH.md`

### Deliverables
- Daily leaderboard + me/top list.
- Referral + caps + heuristics.
- Build code paylaşımı.

### Exit criteria
- Share→new conversion ölçülebilir; abuse guardrails devrede.

### Test plan
- Aynı request → leaderboard skorunu gateway hesaplar (client manipülasyonu etkisiz).
- Referral self-redeem ve spam engeli (cap) çalışır.

### Rollback
- Referral/leaderboard feature flag ile kapatılabilir.

---

## Faz 5 — Monetization MVP
- Kaynak: `docs/ROADMAP.md`

### Deliverables
- Stripe web ödeme + receipt validation + idempotency.
- Starter pack + cosmetics.

### Exit criteria
- Payment success/fail path ölçülür; double-spend yok.

### Test plan
- Aynı payment intent 2× işlenemez.
- Receipt signature doğrulaması zorunlu.

### Rollback
- Offer’ları content/config ile kapat; ödeme endpoint’i read-only moda alınabilir.

---

## Faz 6 — LiveOps + Ölçek + Güvenlik
- Kaynak: `docs/ROADMAP.md`

### Deliverables
- Observability: logs/metrics/traces.
- Feature flags + canary + rate limits.
- Content pipeline (versioned).

### Exit criteria
- p95 latency, error budget ve incident runbook ilk sürüm.

### Test plan
- Load test (minimum): /health, /sim/battle, /daily-seed.
- Rate limit regresyonu: health/metrics dışlanır.

### Rollback
- Canary revert + previous image.

---

## Faz 7 — Native client (opsiyonel)
- Kaynak: `docs/PHASE7_NATIVE.md`

### Not
- Web client “asıl oyun” hedefinde **opsiyoneldir**.

---

## Faz 8 — Game-feel UX (oyun gibi hissettir)
- Kaynak: `docs/ROADMAP_V1_FULL.md`

### Deliverables
- Unit ikonları + role renk kodları + arena arka planı.
- Replay event → anim/VFX mapping standardı.
- Onboarding v2 (progressive disclosure).

### Exit criteria
- “Bu tool değil oyun” hissi: ilk oturumda daily battle click > 40%.

### Test plan
- Reduced motion modu (varsa) ile UI bozulmaz.
- Render perf: replay scrub sırasında UI jank yok (60fps hedef; web budget).

### Rollback
- Görsel katman feature flag ile kapatılabilir (minimum fallback UI).

---

## Faz 9 — İçerik v1 (meta’yı taşıyacak hacim)
- Kaynak: `docs/ROADMAP_V1_FULL.md`

### Deliverables
- 20–40 unit archetype + synergy tier’ları + augment v1.
- Enemy variations: daily seed’e bağlı preset havuzu.

### Exit criteria
- Aynı seed’de en az 5 farklı viable build.

### Test plan
- content validate yeşil.
- Augment roll deterministik: aynı seed+squad → aynı 3 augment.

### Rollback
- `KR_CONTENT_VERSION` rollback (gateway reload/deploy).

---

## Faz 10 — Progression v2 (retention motoru)
- Kaynak: `docs/ROADMAP_V1_FULL.md`

### Deliverables
- Daily/weekly quests + streak + battle pass (lite).
- Claim idempotency + caps + analytics events.

### Exit criteria
- 7 gün boyunca her gün açınca “hedef + ödül” net.

### Test plan
- Quest claim 2×: ikinci deneme no-op.
- Time window: UTC reset edge-case testleri.

### Rollback
- Quest set’i content rollback; claim endpoint’leri “read-only” moda alınabilir.

---

## Faz 11 — Economy + Balancing Toolchain
- Kaynak: `docs/ROADMAP_V1_FULL.md`

### Deliverables
- Economy tables (content) + simulator script.
- Admin balance panel v1 (override + content version switch).
- A/B parametre planı (2–3 ana knob).

### Exit criteria
- “Parametre değişti → 1 gün içinde ölçüldü → rollback mümkün.”

### Test plan
- Simulator: kaynak/sink dengesi hedef aralıkta.
- Override değişikliği audit log üretir.

### Rollback
- Override kapat + content version rollback.

---

## Faz 12 — Anti-abuse / Validation
- Kaynak: `docs/ROADMAP_V1_FULL.md`

### Deliverables
- Leaderboard submit: server-run sim + (gerekirse) signature path.
- Fraud guardrails: claim/referral/purchase caps, anomaly metrikleri.

### Exit criteria
- Replay tamper ile score şişirme pratikte engellenmiş.

### Test plan
- Replay payload manipülasyonu: skor değişmiyor.
- Abuse thresholds: rate-limit ve cap metrikleri doğru artıyor.

### Rollback
- Sıkı doğrulama modları env/flag ile gevşetilebilir (acil durumda).

---

## Faz 13 — Production Launch (deploy + data)
- Kaynak: `docs/PHASE13_PRODUCTION.md`

### Deliverables
- Postgres JSONB persistence + migrations.
- Backup/restore drill.
- Analytics ingest + health/metrics.

### Exit criteria
- 1 tık deploy+rollback, veri kaybı olmadan restore denemesi.

### Test plan
- docker-compose up (db+gateway) + migration koşumu.
- restore denemesi (RTO/RPO notlanır).

### Rollback
- previous image + DB restore/snapshot.

---

## Faz 14 — Seasons + LiveOps Content Factory
- Kaynak: `docs/PHASE14_SEASONS_LIVEOPS.md`

### Deliverables
- Season + event tanımları (content) + validate.
- Content factory checklist + canary/rollback prosedürü.

### Exit criteria
- Season rollover prosedürü “runbook” olarak denenmiş.

### Test plan
- `content:validate` yeşil; seasonId tutarlılığı.
- Event time-window edge-case testleri.

### Rollback
- `KR_META_VERSION` rollback + deploy rollback.

---

## v1.0 Çapraz-kesit checklist (release gate)
- **Determinism**: sim/replay regresyon testi yeşil.
- **Perf**: web bundle + runtime perf bütçesi (replay scrub).
- **Security**: receipt validation + idempotency + caps + audit logs.
- **Ops**: health/metrics/alerts + backup/restore drill tarihli.
- **Content**: validate + version bump + rollback denenmiş.

