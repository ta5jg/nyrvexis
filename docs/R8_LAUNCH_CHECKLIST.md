<!-- =============================================================================
File:           docs/R8_LAUNCH_CHECKLIST.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-01
Last Update:    2026-05-01
Version:        1.0.0

Description:
  R8 — Yayın ve live ops: mağaza yüzeyi + üretim yığını, yedekleme, izleme (SSOT özeti).

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# R8 — Yayın ve live ops (checklist)

Tam teknik derinlik için **`docs/PHASE13_PRODUCTION.md`** (Postgres, analytics ingest, exit criteria) ve **`deploy/README.md`** kullanın. Bu dosya **R8.1** (store) ve **R8.2** (yedek + izleme) için tek sayfalık operasyon özeti sağlar.

---

## R8.1 — Store listeleri, ikon ve görsel

- [ ] **Uygulama kimliği:** `apps/companion-mobile/capacitor.config.ts` içindeki `appId` ile App Store Connect / Play Console paket adı eşleşir.
- [ ] **İkonlar:** iOS App Store 1024×1024; Android adaptive (foreground + background) — Capacitor asset pipeline (`apps/companion-mobile` içinde `resources/` üzerinden `capacitor-assets` veya Xcode/Android Studio yerel asset).
- [ ] **Ekran görüntüleri:** Hedef cihaz boyutları (Apple 6.7" / 6.5"; telefon + isteğe bağlı tablet; Play telefon + 7" tablet önerisi).
- [ ] **Metin:** Kısa / uzun açıklama — şablon alanları için `artifacts/store-listing/TEMPLATE_store_listing.v1.json` + README.
- [ ] **Yasal URL’ler:** Gizlilik / şartlar / destek / hesap-veri — gateway **`KR_LEGAL_*`** + companion **`GET /legal/public`** (`docs/KINDRAIL_RELEASE_ROADMAP.md` R7).
- [ ] **Yaş ve içerik:** Mağaza anketleri için `KR_LEGAL_CONTENT_DESCRIPTORS` ve yerel derecelendirme kuralları.
- [ ] **IAP SKU:** Ürün kimlikleri gateway env (`KR_IAP_BATTLE_PASS_PRODUCT_ID_*`) ve istemci `VITE_IAP_BP_PRODUCT_*` ile aynı (`apps/companion-mobile/README.md` R7.M1).

---

## R8.2 — Prod yedekleme ve izleme

- [ ] **Stack:** `docker compose -f deploy/docker-compose.yml up --build` ile doğrulama (staging). Compose içinde **`KR_DATABASE_URL`** verildiğinde gateway **`PgStore`** kullanır; giriş noktası migrasyonları `psql` ile uygular.
- [ ] **Veritabanı:** Üretimde `KR_DATABASE_URL` zorunlu; FileStore yalnızca dev / tek düğüm fallback.
- [ ] **Migrasyon:** `pnpm --filter @kindrail/gateway db:migrate` veya container girişindeki `psql` sırası (`deploy/docker-entrypoint-gateway.sh`).
- [ ] **Yedek:** `KR_DATABASE_URL=... ./deploy/scripts/backup-postgres.sh` — çıktı `.sql.gz`; çeyrekte bir **restore drill** (`gunzip -c … \| psql "$KR_DATABASE_URL"`).
- [ ] **İzleme:** `/health` (orchestrator probes — Postgres kullanılıyken `checks.database` = `ok` beklenir; FileStore’da `skipped`), `/metrics` (Prometheus), log aggregation (sağlayıcıya göre).
- [ ] **Olaysızlık:** `docs/R6_METRICS_AND_INCIDENTS.md` runbook + rollback notları (`PHASE13_PRODUCTION.md` §7).
- [ ] **Bayraklar:** `GET /flags` — örn. `growth_rewarded_ads` MVP’de kapalı; prod’da bilinçli aç/kapat.

---

## Hızlı komutlar

```bash
# Compose doğrulama (syntax / birleşik config)
docker compose -f deploy/docker-compose.yml config

# Gateway + DB (repo kökü)
docker compose -f deploy/docker-compose.yml up --build

# Statik web + prod API URL
pnpm --filter @kindrail/companion-web build
# VITE_GATEWAY_URL=https://api.example.com

# Migrasyon (Postgres ayakta)
export KR_DATABASE_URL=postgres://...
pnpm --filter @kindrail/gateway db:migrate
```
