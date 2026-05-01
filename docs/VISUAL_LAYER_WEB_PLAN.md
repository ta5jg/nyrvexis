<!-- =============================================================================
File:           docs/VISUAL_LAYER_WEB_PLAN.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-04-30
Version:        0.3.0

Description:
  Web-as-game görsel katman (ikon/arena/VFX/anim) ve asset pipeline planı.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## Web-as-game Visual Layer Plan (KINDRAIL)

Amaç: `apps/companion-web` arayüzünü “debug tool” hissinden çıkarıp **oyun sunumu** seviyesine taşımak; bunu yaparken deterministik sim core’u **dokunulmaz** kalır (görsel katman sadece render eder).

---

## 1) Tasarım ilkeleri
- **Determinism over cosmetics**: görsel efektler sim state’ine etki etmez; sadece event stream’den türetilir.
- **Data-driven**: unit ikonları, rarity frame’leri, VFX presetleri “id” ile bağlanır (content sürümlenebilir).
- **Perf budget**: düşük donanımda replay scrub sırasında jank yok.
- **No runtime fetch**: asset’ler build’e paketlenir; offline/cache dostu.

---

## 2) Asset türleri ve dosya yerleşimi (öneri)

### 2.1 Web asset klasörleri
- `apps/companion-web/src/assets/icons/units/*.svg`
- `apps/companion-web/src/assets/icons/roles/*.svg`
- `apps/companion-web/src/assets/frames/*.svg` (rarity/level)
- `apps/companion-web/src/assets/vfx/*.svg` (hit rings, shield pulse, crit spark)
- `apps/companion-web/src/assets/bg/*.webp` (arena arka plan)

> Vite ile `import icon from "../assets/.../x.svg"` şeklinde build-time bundling yapılır.

### 2.2 UI katmanı modülleri
- `apps/companion-web/src/ui/visual/` (yeni)
  - `unitIcons.ts` (archetypeId → icon import map)
  - `roleColors.ts` (tank/dps/support/control → CSS vars)
  - `vfxPresets.ts` (event kind → VFX preset)
  - `Arena.tsx` (arena bg + formation slots)
  - `UnitCard.tsx` (ikon + stat + role badge)

### 2.3 CSS
- `apps/companion-web/src/ui/styles.css` içinde:
  - `--roleTank`, `--roleDps`, `--roleSupport`, `--roleControl`
  - “reduced motion” için `@media (prefers-reduced-motion: reduce)` fallback

---

## 3) Content ↔ Visual binding modeli

### 3.1 Basit MVP (hemen)
- Web client içinde **hard-coded icon map**: `archetypeId` → svg.
- Avantaj: hızlı; protokol/content schema değişmez.
- Dezavantaj: content değişince client update gerekir.

### 3.2 v1.0 (önerilen)
- `KrUnitArchetypeDef` içine opsiyonel alanlar:
  - `iconId` (string)  — örn. `unit_soldier_v1`
  - `fxProfileId` (string) — örn. `fx_tank_heavy`
- `KrAugmentDef` içine:
  - `iconId`, `rarity`, `uiHint` (optional)
- Web client: `iconId` → import map, `fxProfileId` → preset map.

> Bu model determinism’i bozmaz; sadece render katmanı için “metadata” ekler.

---

## 4) Replay → Anim/VFX mapping

### 4.1 SSOT: event kind
Render katmanı `buildReplayFrames` çıktısındaki log/event bilgilerini **normalize** eder:
- `damage` → hit flash + hp bar tween
- `death` → fade + skull burst (svg)
- `shield_apply` → pulse ring
- `crit` → sparkle + tint

### 4.2 Kural
- Aynı tick’te birden fazla event: deterministic sıra ile queue (stable sort).
- VFX süreleri sim tick’lerinden değil, UI time’dan (örn. 120–250ms) türetilir.

---

## 5) Arena ve formation sunumu
- Formation slotları (0,1,6,7) görsel olarak “2 front / 2 back” grid.
- Team renkleri: A = accent, B = muted/bad varyant.
- “Target highlight”: event’ten gelen src/dst id ile slot glow.

---

## 6) Performans bütçesi (öneri)
- Bundle hedefi: initial JS < 350KB gzip (şu an civarında).
- SVG: mümkünse 1–2KB ikon; karmaşık ikonları optimize et (SVGO).
- Replay scrub: DOM node sayısını düşük tut; animasyonlar `transform/opacity`.

---

## 7) Uygulama sırası (1–2 gün)
1) `src/assets/icons/units/` altında 12–16 ikon (tank/dps/support/control dengeli) + role badge.
2) `UnitCard` + `Arena` ile squad picker’ı kart görünümüne geçir (select fallback kalsın).
3) Replay viewer’da hit/death/crit VFX presetleri (mevcut flash’ı standardize et).
4) “Reduced motion” + accessibility (aria-label + kontrast).

---

## 8) Exit criteria (Visual Layer)
- UI ilk bakışta “oyun” gibi: ikon + arena + net feedback.
- Replay scrub sırasında gözle görülür jank yok.
- Feature flag ile fallback minimal UI açılabiliyor.

