<!-- =============================================================================
File:           docs/FULL_PRODUCT_PARITY_ROADMAP.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-05-01
Last Update:    2026-05-02
Version:        1.2.1

Description:
  Web + mobil için “oynanır, yayınlanır, gelir üretir, türdeş oyunlarla aynı çubukta” hedefi.
  NYRVEXIS_RELEASE_ROADMAP / ROADMAP ile çelişmez; üst seviye parity + ekosistem bağlantısı SSOT.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Tam ürün parity — yol haritası (web + mobil önce)

**Amaç:** Nyrvexis’in async auto-battler olarak **aynı türdeki başarılı ürünlerle aynı algı kalitesinde** (tercihen üzerinde) görünmesi. **Dağıtım önceliği:** tarayıcı + Capacitor mağaza aynı kalır. **Unity**, aynı `@nyrvexis/protocol` JSON’u tüketen **isteğe bağlı sunum katmanı** (altın sahne, rig + Animator, mobil/WebGL hedefi); gateway SSOT simülasyonu değiştirmez.

**Zaten güçlü olan katmanlar** (detay: `docs/NYRVEXIS_RELEASE_ROADMAP.md`):

- Deterministik battle sim + replay + paylaşım
- Meta / Battle Pass / kozmetik / IAP doğrulama (R3 + R7)
- Yayın checklist ve prod yığını (R8)
- CI / E2E smoke

Bu doküman özellikle **eksik kalan “oyun hissi”**, **içerik yoğunluğu** ve **ekosistem köprüleri** için fazları netleştirir.

---

## 1) Çıkış tanımı (Definition of Done — parity)

| Sütun | Ürün kabulu |
|--------|-------------|
| **Combat sunumu** | Arena içinde sürekli okunur hareket; sık ve net vuruş geri bildirimi; ölüm sonrası sahadan çıkış veya belirgin hayalet fazı |
| **Tempo** | İzleme / otomatik oynatma modunda “ölü ekran” yok; olaylar makul aralıklarla |
| **Meta döngü** | Günlük / Pass / mağaza akışı tek oturumda tamamlanabilir |
| **Gelir** | Kozmetik + Pass IAP sunucu doğrulamalı; şeffaf SKU |
| **Yayın** | Mağaza listesi, yasal URL, yaş beyanı, yedek / izleme (R8) |
| **Mobil + web** | Aynı gateway; Capacitor derlemesi store’a uygun |
| **Premium arena (ops.)** | Unity `NyrvexisReplayDirector` + 5 state Animator; `pnpm run unity:golden-export` ile `/sim/battle` köprüsü (`apps/game-unity/README.md`) |

---

## 2) Rakiplerle hizalama — teknik karşılıklar

| Oyunda gördüğünüz | Bizde karşılığı |
|-------------------|-----------------|
| Arena içi hareket | Web: `ArenaCanvas` (patrol + manevra tick zarfı + ateş yönü). Unity: aynı replay JSON → **Idle / Advance / Attack / Hit / Death** (`UnityPackage/Assets/Nyrvexis`). İçerik: atlas/rig borusu ortak hedef |
| Sık ateş | Sim `actThreshold` / pacing preset + replay sıklığı |
| Vuruş efekti | Projectile / beam / impact ripple / hit-stop (ms) — görsel katman |
| Ölen çıkar | `alive` + HP ≤ 0 + kısa fade → çizim kes |
| Uzun oturum | Mevcut ~5–7 dk hedefi; publish için daha kısa **full replay** seçeneği |

---

## 3) Uygulama fazları (özet)

### R9 — Combat spectacle (web öncelik)

- [x] **R9.P0** — Replay HP pacing ile sim hizası (önceki düzeltme)
- [x] **R9.P1** — Tempo: `MATCH_PACING.actThreshold` ↓ (220); istemci Auto-play hedef süresi ~4 dk
- [x] **R9.P2** — Hareket (başlangıç): sürekli combat sway (`ArenaCanvas`)
- [x] **R9.P3** — Vuruş (başlangıç): hedef impact ripple (`ArenaCanvas`)
- [x] **R9.P4** — Juice: ekran shake (crit/hit, reduce-motion kapalı) + vuruş hattında hareketli mermi noktası (`ArenaCanvas`)
- [x] **R9.P5** — İskala satışı: MISS kesik trayektori + hedef ötesi uç + yüzen `MISS` etiketi; replay Miss tick’inde saldırganda `atkIds` (`ArenaCanvas`, `replay.ts`)

### R10 — Altın sahne + Unity köprüsü (sunum SSOT genişlemesi)

- [x] **R10.P1** — Protokol DTO eşlemesi (`KrBattleModels.cs`) + `NyrvexisBattleExportDto` (`request` + `result`)
- [x] **R10.P2** — `BattleReplayIndex` + slot layout web ile hizalı (`ArenaLayout`)
- [x] **R10.P3** — `NyrvexisReplayDirector` → drift olayları → **Idle / Advance / Attack / Hit / Death**
- [x] **R10.P4** — Örnek `nyrvexis-golden-battle-export.json` + `pnpm run unity:golden-export` (`POST /sim/battle`)
- [ ] **R10.P5** — Rigged prefab + gerçek clip’ler (idle/advance/attack/hit/death) — sanat borusu
- [x] **R10.P6** — Companion’dan tek tık **Unity export** indirme (aynı JSON şekli — `downloadJsonFile` + Result / battle toolbar)
- [x] **R10.P7** — Sim’de isteğe bağlı **pozisyon / anim niyeti** (`presentation.srcIntent` / `dstIntent`, `KrBattleAnimIntent`); salt görsel; Unity `NyrvexisReplayDirector` + `PlayFromIntent`

### R11 — İçerik ve onboarding

- [ ] Archetype sayısı ve görünür yetenek okuması (telegraph ikonları)
- [ ] Tutorial ilk maç (deterministik seed + VO metin)
- [ ] Store görselleri ve battle screenshot pipeline

### R12 — Ekosistem köprüleri (Q-Verse / USDTgVerse)

**İlke:** Oyun ekonomisi SSOT gateway; zincir / partner sistemleri **ödeme veya kimlik köprüsü** olarak bağlanır (asıl simülasyon zincirden bağımsız kalır).

- [ ] Tekilleştirilmiş **harici hesap bağlama** (OAuth veya imzalı payload) — partner tenant id
- [ ] **Ödeme / kredi** webhook veya hazır ödeme sağlayıcı redirect — grant yine sunucuda
- [ ] Ortak **SKU / kampanya** metadata şablonları (`artifacts/campaigns/` ile uyumlu)
- [ ] Oran sınırı ve fraud (IP + device + anomaly) — gelir arttıkça sıkılaştırma

### R13 — İleri görsel deneyler (isteğe bağlı)

- [ ] Pixi kart-sahası dışında **saha Sprite** hattı veya particle budget artışı
- [ ] WebGL Unity derlemesi boyut/performans bütçesi (R10 ile birlikte planlanır)

---

## 4) Ölçütler (parity KPI)

- **Time-to-first-impact**: sahneye girdikten ilk hasar görseline kadar süre (hedef: ilk birkaç saniye içinde Auto-play)
- **Silent streak**: üst üste X saniye hiç `hit`/`ability` yok (hedef: minimize)
- **D1 / session length** — meta bağlandıktan sonra
- **Store**: ilk IAP funnel tamamlama oranı (sandbox → prod)

---

## 5) İlgili dosyalar

- `docs/NYRVEXIS_RELEASE_ROADMAP.md` — ticari + yayın SSOT
- `docs/ROADMAP.md` — fazlı ürün
- `docs/VISUAL_LAYER_WEB_PLAN.md` — görsel katman ilkeleri
- `docs/R8_LAUNCH_CHECKLIST.md` — prod çıkış
- `packages/protocol/src/v1/battlePacing.ts` — sim tempo sabitleri
- `apps/companion-web/src/ui/visual/ArenaCanvas.tsx` — arena juice (web lite parity)
- `apps/game-unity/UnityPackage/` — Unity altın sahne scripts + Resources

---

## 6) Son güncelleme notları (R10 omurgası)

- R9 çizgisinde web arena juice + tempo (önceki tur).
- R10: Unity paketi, golden JSON, gateway export script, beş Animator durumu sözleşmesi.
