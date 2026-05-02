<!-- =============================================================================
File:           docs/PHASE14_SEASONS_LIVEOPS.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Faz 14 — Seasons + LiveOps content factory

Bu fazın hedefi: oyun döngüsünü **sezon** kavramı ile ürünleştirmek ve içerik üretimini “factory” haline getirmek.

## 1) Season tanımı

- Gateway: `GET /season` → aktif sezon tanımı.
- Kaynak dosya: `services/gateway/src/content/catalogs/season.<KR_META_VERSION>.json`
- Meta dosyası: `services/gateway/src/content/catalogs/meta.<KR_META_VERSION>.json`
  - `seasonId` alanı season dosyası ile **aynı olmalı**.

Doğrulama:

```bash
pnpm --filter @nyrvexis/gateway content:validate
```

## 2) Season rollover (ops)

Bu repo “restart/deploy ile rollover” yaklaşımını kullanır:

1. Yeni sezon için `meta.<new>.json` ve `season.<new>.json` oluştur.
2. `KR_META_VERSION`’ı hedef ortamda yeni versiyona güncelle.
3. Gateway `POST /admin/reload` ile reload edilebilir (admin token ile), fakat prod’da config+deploy ile yapmak daha güvenli.

> Not: Battle pass state zaten `userId:seasonId` ile key’lenir. Yeni `seasonId` geldiğinde kullanıcılar otomatik yeni track’e başlar; eski track state arşiv olarak kalır.

## 3) Limited-time event’ler (MVP)

- Gateway: `GET /event` → aktif event (time window içinde) veya boş.
- Kaynak dosya: `services/gateway/src/content/catalogs/event.<KR_META_VERSION>.json`
- Quest tanımlarını (meta content) event süresince değiştirmek (en basit LiveOps).
- Feature flags ile “event UI” aç/kapat (event def içinde `flag` alanı).

## 4) Content factory checklist

- [ ] `content:validate` yeşil
- [ ] JSON schema emission (`pnpm --filter @nyrvexis/protocol schema:json`) yeşil
- [ ] Canary deploy + hızlı rollback planı
- [ ] KPI dashboard: daily active, claim rate, leaderboard submit rate

