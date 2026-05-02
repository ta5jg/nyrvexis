<!-- =============================================================================
File:           docs/SPRINT1_DEPLOY.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-02
Last Update:    2026-05-02
Version:        1.0.0

Description:
  Sprint 1 — Nyrvexis public deploy (Fly.io free tier + Neon free Postgres
  + Cloudflare Pages). Sıfır maliyet ile MVP'yi internete çıkarmak için
  adım adım rehber.
============================================================================= -->

# Sprint 1 — Public Deploy (€0 MVP)

**Hedef:** `api.nyrvexis.com` (gateway) + `app.nyrvexis.com` (web), ücretsiz katmanda.

**Bileşenler:**
- **Neon** (managed Postgres, 0.5 GB free) — `KR_DATABASE_URL`
- **Fly.io** (gateway container, shared-cpu free tier) — `nyrvexis-gateway`
- **Cloudflare Pages** (companion-web statik) — `nyrvexis-web`

**Toplam aylık:** **€0** MVP. Trafik artınca Fly machines auto-stop yerine min=1 yapılır (~$2/ay).

---

## 0. Ön gereksinimler

```bash
# Bir kez:
brew install flyctl                      # macOS; alternatif: curl -L https://fly.io/install.sh | sh
fly auth signup                          # veya: fly auth login
fly auth whoami                          # doğrula

# Cloudflare hesabı + ekli domain (nyrvexis.com).
# Neon hesabı: https://console.neon.tech (GitHub ile login)
```

---

## 1. Neon — Postgres oluştur

1. https://console.neon.tech → **Create Project**
   - Name: `nyrvexis`
   - Postgres version: 16
   - Region: **AWS Frankfurt (eu-central-1)** (Fly Frankfurt'a en yakın)
2. Project oluştuğunda **Connection Details** → **Pooled connection** seç → **Copy** (gizli notlara kaydet).
   - Format: `postgres://USER:PASS@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`
3. (Opsiyonel) **Branches** → `staging` adında ikinci branch aç → ayrı bir staging connection string elde edersin.

> **Neon free tier sınırları:** 0.5 GB storage, 1 project, suspend after 5 min idle (ilk istekte ~1s cold start). Nyrvexis'in MVP veri hacmi için fazlasıyla yeterli.

---

## 2. Fly.io — Gateway aç

Repo kökünde:

```bash
# 1) App oluştur (henüz deploy etme):
fly apps create nyrvexis-gateway --org personal

# 2) fly.toml zaten repo kökünde. Doğrula:
fly config validate

# 3) Secrets — .env.fly.example'dan değerleri al:
fly secrets set \
  KR_AUTH_SECRET="$(openssl rand -hex 32)" \
  KR_DATABASE_URL="postgres://USER:PASS@ep-xxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require" \
  KR_CORS_ORIGIN="https://app.nyrvexis.com" \
  KR_LEGAL_PRIVACY_URL="https://nyrvexis.com/privacy" \
  KR_LEGAL_TERMS_URL="https://nyrvexis.com/terms" \
  KR_LEGAL_SUPPORT_EMAIL="support@nyrvexis.com" \
  KR_LEGAL_ACCOUNT_DELETION_URL="https://nyrvexis.com/account-data" \
  KR_LEGAL_CONTENT_DESCRIPTORS="Animated combat, no gambling, no random paid loot."

# 4) İlk deploy:
fly deploy

# 5) Healthcheck:
curl https://nyrvexis-gateway.fly.dev/health | jq .
```

İlk deploy ~3-4 dk sürer (Docker build + push + machines start). Migration'lar entrypoint script'inde otomatik koşar (`docker-entrypoint-gateway.sh`).

> **İpucu:** `fly logs -a nyrvexis-gateway` deploy boyunca canlı log akıtır.

---

## 3. Custom domain — `api.nyrvexis.com`

```bash
# Fly tarafı:
fly certs create api.nyrvexis.com -a nyrvexis-gateway

# Cloudflare DNS panelinde:
#  Type: CNAME
#  Name: api
#  Target: nyrvexis-gateway.fly.dev
#  Proxy: GRİ BULUT (DNS only) — Fly TLS'i kendisi yönetir.
```

5 dk sonra:
```bash
fly certs show api.nyrvexis.com -a nyrvexis-gateway   # Status: Ready beklenir
curl https://api.nyrvexis.com/health
```

---

## 4. Cloudflare Pages — companion-web

```bash
# 1) Yerel build doğrula:
VITE_GATEWAY_URL=https://api.nyrvexis.com pnpm --filter @nyrvexis/companion-web build

# 2) Cloudflare Pages dashboard:
#    Pages → Create → Connect to Git → ta5jg/nyrvexis repo
#    Build config:
#      Framework preset:   None
#      Build command:      pnpm install --frozen-lockfile && pnpm --filter @nyrvexis/protocol build && pnpm --filter @nyrvexis/sdk-ts build && pnpm --filter @nyrvexis/companion-web build
#      Build output:       apps/companion-web/dist
#      Root directory:     /
#      Environment variables:
#        VITE_GATEWAY_URL = https://api.nyrvexis.com
#        NODE_VERSION     = 22
#        PNPM_VERSION     = 9.15.0
#
# 3) Custom domain bağla: Pages → nyrvexis-web → Custom domains → app.nyrvexis.com
#    Cloudflare otomatik DNS kaydı ekler ve TLS verir.
```

`apps/companion-web/public/_headers` ve `_redirects` build çıktısında yer alır → SPA fallback + güvenlik header'ları otomatik.

---

## 5. Smoke test (tam akış)

```bash
# Gateway sağlığı (Postgres bağlı mı?):
curl -s https://api.nyrvexis.com/health | jq '.checks'
# beklenen: { "database": "ok", "store": "pg" }

# Anonim oturum:
curl -s -X POST https://api.nyrvexis.com/auth/guest \
  -H "content-type: application/json" \
  -d '{"v":1,"deviceId":"smoke-test"}' | jq

# Web client UI:
open https://app.nyrvexis.com
# → Enter battle → Run battle → outcome dönmeli
```

---

## 6. Sürekli deploy (CI hook — opsiyonel ama önerilen)

`.github/workflows/nyrvexis-deploy.yml` (yeni dosya, henüz commit'lenmedi — istersen ekleyelim):

```yaml
name: Deploy gateway to Fly
on:
  push:
    branches: [main]
    paths:
      - 'services/gateway/**'
      - 'packages/protocol/**'
      - 'deploy/**'
      - 'fly.toml'
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Cloudflare Pages zaten Git push'larda otomatik build alır.

---

## 7. Yedekleme (Neon)

Free tier 7 gün point-in-time recovery dahil veriyor (Neon dashboard → Restore). Manuel `pg_dump` istersen:

```bash
docker run --rm -e PGPASSWORD=PASS postgres:16-alpine \
  pg_dump -h ep-xxx.eu-central-1.aws.neon.tech -U USER -d neondb -f /tmp/dump.sql

# veya: deploy/scripts/backup-postgres.sh KR_DATABASE_URL=... kullan
```

Aylık restore drill: dump → staging branch'e yükle → smoke test.

---

## 8. Monitoring (Sentry — sonraki sprint)

Bu sprint'te bilinçli olarak dışarıda. Bir sonraki tur:
- Companion-web'e `@sentry/browser` (~30 KB gz)
- Gateway'e `@sentry/node`
- Fly.io machine logs → BetterStack veya Axiom (free tier)

---

## 9. Maliyet kontrolü

| Servis | Plan | Limit | Aylık |
|---|---|---|---|
| Neon | Free | 0.5 GB, 1 proje, suspend after idle | €0 |
| Fly.io | Free shared-cpu | 3 vm, 3 GB persistent storage | €0 |
| Cloudflare Pages | Free | unlimited bandwidth, 500 build/ay | €0 |
| Cloudflare DNS | Free | unlimited records | €0 |
| Domain | yıllık | `nyrvexis.com` (~€10/yıl) | ~€1 |
| **TOPLAM** | | | **~€1/ay** |

Trafik DAU > 1k civarında Fly machines'i `min_machines_running = 1` yap (~$2/ay). PG > 0.5 GB olunca Neon Launch ($19/ay).

---

## 10. Rollback

```bash
# Önceki release'i listele:
fly releases list -a nyrvexis-gateway

# Spesifik versiyona dön:
fly deploy --image registry.fly.io/nyrvexis-gateway:v23
```

DB migration geri alınamaz — şemayı kıracak değişiklikleri her zaman **additive** yap (yeni column nullable + default), yıkıcıyı sonra ayrı migration ile.

---

## Tamamlanma kriteri (Sprint 1 done)

- [ ] `https://api.nyrvexis.com/health` → 200, `database: ok`
- [ ] `https://app.nyrvexis.com` → home gate görünür, gateway "Connected"
- [ ] `pnpm test` lokalde + GitHub Actions'da yeşil
- [ ] Neon dashboard → 1+ row in `users`, `analytics_events`
- [ ] Web push subscribe çalışıyor (opsiyonel; VAPID secrets yüklendi mi?)
- [ ] Fly.io alert email aktif (`fly secrets list` boş değil)
