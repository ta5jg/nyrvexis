<!-- =============================================================================
File:           docs/NYRVEXIS_FINAL_SHIP_STEPS.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-02
Last Update:    2026-05-02
Version:        1.0.0

Description:
  Nyrvexis’i “final / yayına yakın ürün” çubuğuna taşımak için sıralı adımlar.
  SSOT ticari + yayın: NYRVEXIS_RELEASE_ROADMAP.md + R8_LAUNCH_CHECKLIST.md.
  Parity / spectacle: FULL_PRODUCT_PARITY_ROADMAP.md.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Nyrvexis — Final teslimat adımları

Bu liste **yürütme sırasına** göre dizilir: önce doğruluk ve çıkış kapısı, sonra içerik ve premium sunum.

---

## A — Çıkış tanımı (Definition of Done)

| # | Madde | Kontrol |
|---|--------|---------|
| A1 | Uçtan uca oturum: giriş → maç → sonuç → meta → tekrar | Manuel + Playwright smoke |
| A2 | Gateway SSOT: aynı seed → aynı sonuç | Determinizm testleri |
| A3 | Mobil (Capacitor) production build | Xcode / Android Studio |
| A4 | Mağaza gereksinimleri | `docs/R8_LAUNCH_CHECKLIST.md` |
| A5 | Arena okunabilirlik | MISS / hit / ölüm geri bildirimi net |

---

## B — Teknik kapılar (önce bunlar)

1. **CI yeşil** — kök `pnpm` scriptleri + gateway typecheck + companion-web build.
2. **Prod yığını** — `deploy/` healthcheck, Postgres `KR_DATABASE_URL`, yedek politikası (`NYRVEXIS_RELEASE_ROADMAP` R8).
3. **IAP gerçek sandbox** — SKU’lar mağazada; misafir IAP kapalı (kimlik zorunlu) doğrulanmış akış.
4. **Gözlemlenebilirlik** — yapılandırılmış log, `/health.checks.*`, incident runbook.

---

## C — Combat ve replay (web öncelik)

1. **Tempo** — `MATCH_PACING` ile maç süresi ve aksiyon yoğunluğu (`battlePacing.ts`).
2. **İskalalar** — sim `baseHitPct`; web’de MISS satışı: kesik trayektori + yüzen `MISS` (`ArenaCanvas`); Miss tick’inde saldırganda `atkIds` (`replay.ts`).
3. **Salınım cezası** — idle’da sürekli sinüs yerine olay güdümlü juice (`ArenaCanvas`).
4. **“Fanus” aşaması** — oval portre halkası → tam gövde sprite veya ring opacity tema (sanat + tek seçim).

---

## D — İçerik ve onboarding (R11)

1. Archetype / yetenek **telegraph** (ikon + kısa metin).
2. İlk maç **tutorial** (sabit seed + 3–5 adım).
3. Mağaza görselleri ve battle screenshot pipeline.

---

## E — Premium sunum (Unity / R10)

1. **R10.P5** — rig + gerçek Animator clip seti (idle / advance / attack / hit / death).
2. Golden export köprüsü — zaten var; clip takılı prefab ile demoya yükselt.
3. İsteğen WebGL boyutu ve bütçe (R13).

---

## F — Ekosistem (isteğe bağlı, R12)

Partner kimlik / ödeme köprüleri; fraud sıkılaştırma gelir arttıkça.

---

## Önerilen sıra (özet)

```
B (kapılar) → C (web combat satışı) → D (onboarding) → E (Unity premium) → F
```

İlgili dosyalar: `apps/companion-web/src/ui/visual/ArenaCanvas.tsx`, `apps/companion-web/src/ui/replay.ts`, `services/gateway/src/sim/battleSim.ts`, `packages/protocol/src/v1/battlePacing.ts`, `docs/VISUAL_LAYER_WEB_PLAN.md`.
