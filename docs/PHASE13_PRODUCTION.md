<!-- =============================================================================
File:           docs/PHASE13_PRODUCTION.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Faz 13 — Production launch (deploy + data)

Bu fazın hedefi: **deploy edilebilir yığın**, **Postgres kalıcılığı**, **yedek/restore**, **minimal analitik ingest**, **gözlemlenebilirlik** ve operasyon notları.

## 1) Kalıcılık: FileStore vs Postgres

- **Varsayılan (lokal):** `KR_DATABASE_URL` yok → `services/gateway` mevcut **`store.json`** (`KR_STORE_DIR`) davranışını korur.
- **Prod önerisi:** `KR_DATABASE_URL=postgres://...` → tüm oyun durumu tek satır **`gateway_state`** tablosunda **JSONB** olarak saklanır (FileStore ile aynı `StoreState` şekli). Handler kodu değişmeden kalır.

### Migrasyonlar

SQL dosyaları: `services/gateway/migrations/*.sql` (sırayla uygulanır).

```bash
export KR_DATABASE_URL=postgres://user:pass@localhost:5432/nyrvexis
pnpm --filter @nyrvexis/gateway db:migrate
```

### FileStore → Postgres tek sefer

```bash
export KR_DATABASE_URL=...
export KR_STORE_DIR=.kr-data   # store.json burada
pnpm --filter @nyrvexis/gateway db:import-filestore
```

## 2) Docker (minimum IaC)

```bash
docker compose -f deploy/docker-compose.yml up --build
```

- **db:** Postgres 16, kullanıcı/DB `nyrvexis`.
- **gateway:** imaj build + container start öncesi **`psql -f`** ile migrasyonlar.
- Üretimde `KR_AUTH_SECRET` ve DB şifrelerini **secret store** ile verin; compose içindeki varsayılanları kullanmayın.

Companion-web statik dağıtım: `pnpm --filter @nyrvexis/companion-web build` → `apps/companion-web/dist` (CDN / nginx / object storage). `VITE_GATEWAY_URL` ile prod API adresini verin.

## 3) Yedek ve restore

Örnek yedek (custom format + gzip):

```bash
chmod +x deploy/scripts/backup-postgres.sh
KR_DATABASE_URL=postgres://... ./deploy/scripts/backup-postgres.sh
```

Restore (örnek, `backup-postgres.sh` çıktısı `.sql.gz` ise):

```bash
gunzip -c backup.sql.gz | psql "$KR_DATABASE_URL"
```

**Drill:** çeyrekte bir restore denemesi yapın; RTO/RPO hedefinizi buna göre yazın.

## 4) Analitik (ingest)

`KR_DATABASE_URL` açıkken:

- `POST /analytics/event` — gövde: `KrAnalyticsEventRequest` (`packages/protocol`).
- Satırlar `analytics_events` tablosuna yazılır (warehouse/Metabase/BigQuery sonradan bağlanır).
- FileStore-only ortamda endpoint **503** `ANALYTICS_REQUIRES_DATABASE` döner.

Metrikler: `kr_analytics_events_ingested_total`, `kr_analytics_events_failed_total` (`GET /metrics`).

## 5) Gözlemlenebilirlik

- **Health:** `GET /health` — `checks.database`: `ok` | `skipped` | `error` (`skipped` when `KR_DATABASE_URL` yok; Postgres kullanıldığında ping).
- **Prometheus:** `GET /metrics`.
- Loglar: Fastify structured log; `x-kr-trace-id` ile korelasyon.

## 6) Secrets

- Asla repoya gerçek secret commit etmeyin.
- `.env.example` şablon; gerçek değerler CI/CD veya 1Password/Doppler vb.

## 7) Rollback

- Uygulama: önceki container imajına / deployment revision’a dönün.
- Veri: restore dump veya DB snapshot (sağlayıcıya göre).

## Exit criteria (Faz 13)

- [ ] `docker compose` ile gateway + Postgres ayağa kalkıyor.
- [ ] `db:migrate` + (isteğe bağlı) `db:import-filestore` dokümante ve denendi.
- [ ] Yedek script çalıştı; en az bir restore denemesi notlandı.
- [ ] `/health` ve `/metrics` prod izlemede kullanılabilir.

Sonraki adım: **Faz 14** (sezon + LiveOps içerik fabrikası) — Postgres ve deploy hattı hazır olduktan sonra.

## Faz 14 notu (seasons + liveops)

- Sezon tanımı: `services/gateway/src/content/catalogs/season.<KR_META_VERSION>.json`
- Meta içindeki `seasonId` ile season dosyasındaki `seasonId` **eşleşmeli**.
- Doğrulama: `pnpm --filter @nyrvexis/gateway content:validate`
- Event tanımı: `services/gateway/src/content/catalogs/event.<KR_META_VERSION>.json` (MVP tek event)
