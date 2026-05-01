<!-- =============================================================================
File:           docs/R6_METRICS_AND_INCIDENTS.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-01
Last Update:    2026-05-01
Version:        1.0.0

Description:
  R6.3 — gözlemlenebilirlik (metrikler) ve olay müdahalesi özeti.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## KINDRAIL — Metrikler ve incident runbook (R6.3)

### Metrikler (gateway)

| Endpoint / kaynak | Amaç |
|-------------------|------|
| `GET /health` | Liveness — servis + sürüm (`KR_SERVICE_VERSION`). CI smoke öncesi kapı. |
| `GET /metrics` | Prometheus metin (`kindrail-gateway`): route sayaçları ve HTTP status dağılımı (gateway iç `metrics` modülü). |
| Uygulama logları | Fastify `req.log` — ekonomi/IAP denetimleri (`r3_audit`, `r7_audit` vb.). |

**Önerilen prod:** Prometheus scrape → `GET /metrics`; alert kuralı ör. `health` başarısız 3 dk veya 5xx oranı eşiği.

### Incident — ilk 15 dakika

1. **Sinyal:** Sağlık kontrolü kırmızı veya hata oranı sıçraması.
2. **Ayır:** Sorun katmanı — gateway mi, DB mi, CDN/PWA cache mi, mağaza IAP mi?
3. **Mitigate:** Okuma yükünü düşür — rate limit zaten var; gerekirse feature flag (`/flags`) ile riskli uçları kapatın (kodda tanımlı bayraklara bağlı).
4. **Geri al:** Son bilinen iyi imaj — `deploy/docker-compose.yml` ile `gateway` servisini önceki digest’e çekin veya önceki release branch’ten yeniden build.
5. **İletişim:** Oyuncuya statik durum sayfası / mağaza “bakım” mesajı (politikaya göre).

### CI ile ilişki

- **KINDRAIL CI** başarısızsa merge bloklanır: derleme + gateway typecheck + Playwright smoke.
- Günlük push cron (`kindrail-push-daily.yml`) ayrı secret’lar gerektirir; gateway ayakta değilse cron başarısız — uyarı üretin.
