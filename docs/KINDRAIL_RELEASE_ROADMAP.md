<!-- =============================================================================
File:           docs/KINDRAIL_RELEASE_ROADMAP.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-05-01
Version:        1.12.0

Description:
  Kindrail → yayına kadar fazlı plan (web + Capacitor mobil önce; ayrı native sonra).
  v1.1: Ticari model (SSOT) + R3/R7 ile hizalı ticari MVP checklist.
  v1.2: R1 tamamlandı — kabuk, dokümantasyon, CI kapısı, squad deep link.
  v1.3: R2 tamam satırları + R2.P1 (istemci + gateway); güvenli mobil token saklama.
  v1.4: R3 MVP — meta/Battle Pass/görev/kozmetik gateway + companion-web + ekonomi tuning + temel kötüye kullanım sınırları.
  v1.5: R7 köprüsü — Premium BP IAP doğrulama (Apple verifyReceipt + Play ürün token) + meta içerik/denge genişlemesi.
  v1.6: R4 — maç ürünleştirme (prep/Victor banner/replay UX + arena DPI responsive canvas).
  v1.7: R5 — sanat yönü SSOT, UI rol tokenları, olay-VFX presetleri, genişletilmiş SFX + mute.
  v1.8: R6 — Playwright E2E smoke + CI kapısı; cihaz/OS matrisi ve metrik/incident dokümanları; gateway build içerik JSON kopyası.
  v1.9: R7 uyumu — `GET /legal/public` + companion `LegalFooter`; içerik beyanı için opsiyonel `KR_LEGAL_CONTENT_DESCRIPTORS`.
  v1.10: R7.M1 — Capacitor `@capgo/native-purchases` (StoreKit / Play Billing) ile BP yerel satın alma → gateway doğrulama.
  v1.11: R7.M5 (MVP’de rewarded ads yok; `growth_rewarded_ads` bayrağı) + BD.M1/M2 şablonları (`artifacts/campaigns/`).
  v1.12: R8 — yayın checklist (`docs/R8_LAUNCH_CHECKLIST.md`), deploy README + compose healthcheck; gateway `KR_DATABASE_URL` → Postgres `PgStore`; `/health.checks.database`.

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

# Kindrail — Yayın Yol Haritası (SSOT)

**Öncelik:** Kindrail oyunu.  
**Mimari:** Tek repo; **Web** (`companion-web`) + **Mobil** (`companion-mobile` / Capacitor). Sunucu **tek doğruluk kaynağı** (`services/gateway`).  
**İkinci aşama:** İsteğe bağlı ayrı native istemci — aynı API/protokol.

Taktik ürün derinliği için `docs/ROADMAP.md` ile birlikte kullanın.

---

## Ticari model (SSOT — ürün kararı)

**Platform:** Oyuncu kısıtlanmaz — **iOS ve Android**’de aynı ürün ve **aynı ekonomi** (tek repo: web build + Capacitor). Web, paylaşım ve erişim için kalır; mağaza geliri mobil mağazalar + web politikasına uygun teklifler üzerinden tanımlanır.

**Gelir karması (onaylı):**

| Kanal | Açıklama |
|--------|-----------|
| **Battle Pass** | Ücretsiz + ücretli ödül hatları; ödüller **sunucuda tanımlı**, mümkün olduğunca **deterministik iz** (satın alınan premium hat net içerik). |
| **Kozmetik IAP** | Doğrudan satın alınan SKU’lar (görünüm, çerçeve, arena teması, VFX paketi vb.). **Pay-to-win yok.** |
| **Rewarded ads (isteğe bağlı)** | Oyuncu **isteğiyle**; ödül türleri güç satmadan (ör. kozmetik para, küçük kozmetik; Battle Pass ilerlemesi varsa sunucu kurallarına bağlı ve şeffaf). |
| **Bundle kampanyaları** | Süreli veya temalı **sabit içerik paketleri** (deterministik ürün listesi). |

**Kırmızı çizgi (ahlaki ve uyum):**

- **Bahis ve kumar** yok; oyuncudan **ücret alınan şans / rastgele ödül** mekanikleri yok (ör. ücretli loot box, ücretli şans çarkı, gerçek para ile belirsiz çıktı).
- Ücret ödediği anda oyuncu **ne satın aldığını** net görebilmeli (şeffaf SKU veya şeffaf Pass izi).

**Teknik ilke:** Ödeme ve ödül **`services/gateway`** üzerinde doğrulanır; istemci tek başına ekonomik doğruluk kaynağı değildir.

---

## Ticari MVP checklist (R3 + R7 bağlantılı)

Aşağıdaki maddeler **satılabilir** bir ilk sürüm için kontrol listesidir. Tam ölçekli gelir için **R2** (hesap) ve **R8** (yayın/live ops) ile birlikte yürütülür.

### R3 — Meta ve monetizasyon ürünleştirme

- [x] **R3.M1** — Sezon / Battle Pass tanımı: süre, ücretsiz hat, premium hat, ödül tablosu (**meta + season JSON**, `GET /season/view`, `GET /meta/progress`, BP claim).
- [x] **R3.M2** — Kozmetik envanter modeli: SKU listesi (meta `cosmetics`), sahiplik, takma seçimi (`GET /cosmetics/*`, `POST /cosmetics/equip`; ödül `KrQuestReward.cosmeticId`).
- [x] **R3.M3** — Günlük görev / yeniden giriş hedefleri (meta `quests` + günlük claim / leaderboard / shop köprüleri + quest claim).
- [x] **R3.M4** — Oyuncu panelinde mağaza ve Pass UI (**companion-web** Season & meta + Cosmetics kartları).
- [x] **R3.M5** — Ekonomi kötüye kullanım sınırları (**leaderboard submit** günlük üst sınır 48; meta claim başına günlük üst sınır 240; `req.log` ile `r3_audit`; grant’lar sunucu doğrulamalı).

### R7 — Mağaza, ödeme doğrulama, reklam uyumu

- [x] **R7.M1** — **Apple** ve **Google Play** IAP entegrasyonu (**teknik:** `@capgo/native-purchases` + companion-web `nativeBattlePassIap.ts` — mağaza listesi + cihazda satın alma → gateway `POST /iap/battle-pass/verify`; **operasyon:** SKU’lar mağazada oluşturulur; iOS IAP capability + Android `BILLING`; gerçek satış için dahili/sandbox test).
- [x] **R7.M2** — **Receipt / Purchase Token doğrulaması** gateway’de (**Tamam:** `POST /iap/battle-pass/verify` — Apple legacy `verifyReceipt`, Android Play Developer API `purchases.products.get`, makbuz fingerprint `iapGrants`, bağlı hesap zorunlu; opsiyonel **KR_IAP_ALLOW_STUB** + `STUB_PREMIUM` yalnız dev).
- [x] **R7.M3** — Gizlilik politikası, kullanım şartları, hesap silme / veri talepleri süreci (**teknik:** gateway `GET /legal/public` + `KR_LEGAL_*`; companion footer linkleri; **operasyon:** gerçek URL ve süreç yayında doldurulur).
- [x] **R7.M4** — Yaş derecelendirmesi ve içerik beyanı (**teknik:** `KR_LEGAL_CONTENT_DESCRIPTORS` → istemcide “Store disclosure notes”; mağaza yaş işaretleri ve yasal metin operasyon + hukuk).
- [x] **R7.M5** — Rewarded ads (**MVP:** kullanılmıyor; gateway `growth_rewarded_ads=false` varsayılan, `GET /flags`; eklenecekte ATT / Android rıza + isteğe bağlı ödül + sunucu doğrulaması — `artifacts/campaigns/README.md`).

### Bundle kampanyaları ve operasyon

- [x] **BD.M1** — Kampanya takvimi şablonu (**`artifacts/campaigns/TEMPLATE_bundle_calendar.v1.json`** + README iş akışı).
- [x] **BD.M2** — Mağaza metadata şablonu (**`artifacts/campaigns/TEMPLATE_bundle_offer_localization.v1.json`**; gerçek ödül tablosu şimdilik `KrOffer` / `offers.ts` SSOT).

### R2 ön koşul (satın alma güvenliği)

Ödeme hesaba bağlanmadan yapılıyorsa **kayıp satın alma / cihaz değişimi** riski yüksektir. Üretim öncesi hedef:

- [x] **R2.P1** — Misafir → kalıcı hesap bağlama veya doğrudan kayıtlı kullanıcı ile ilk IAP akışı (**istemci + gateway:** checkout `403` + `IDENTITY_REQUIRED` misafir için; tam mağaza doğrulaması **R7**).

---

## Çıkış tanımı (yayına hazır)

- Uçtan uca akış: giriş → kadro/maç → sonuç → ilerleme → tekrar.
- Kimlik ve ilerleme sunucuda; web ↔ mobil aynı hesap (politikaya göre).
- Görsel/VFX minimum kabul çubuğu: arena okunur, kritik geri bildirimler var.
- Mağaza / IAP kullanılıyorsa sunucu doğrulamalı; gizlilik + yaş uyumu.
- Test matrisi ve gözlemlenebilirlik (crash / ekonomi).

---

## Faz R1 — Oyun kabuğu + Capacitor omurgası (tamamlandı)

| ID | Çıktı | Durum |
|----|--------|--------|
| R1.1 | Giriş / ana akış ayrımı (oyun hissi) | **Tamam:** `HomeGate`, URL ile doğrudan dashboard, oturum içi `sessionStorage` ile yenilemede kabukta kalma |
| R1.2 | `pnpm build` → `cap sync` dokümante | **Tamam:** kök `pnpm run mobile:sync`, README + `apps/companion-mobile/README.md` |
| R1.3 | iOS/Android iç test build | **Tamam:** CI `kindrail-ci.yml` web derlemesi + gateway typecheck; mağaza yükleme Xcode/Android Studio ile yerel |
| R1.4 | Deep link / URL kadro (`readInitialSquadFromUrl`) ile uyum | **Tamam:** `?q=` + ek `?squad=a,b,c,d` (ön L/R, arka L/R archetype id) |

---

## Faz R2 — Kimlik ve çoklu cihaz

| ID | Çıktı | Durum |
|----|--------|--------|
| R2.1 | OAuth veya email ile kayıt/giriş | **Tamam:** gateway + SDK + companion-web (`authLoginEmail`, Google GIS, guest) |
| R2.2 | Refresh token + güvenli mobil saklama | **Tamam:** rotation gateway’de; native’de `capacitor-secure-storage` (`device.ts` + `main.tsx` bootstrap); web’de `localStorage` |
| R2.3 | Misafir → hesap bağlama (politika) | **Tamam:** bağlama akışları + checkout için bağlı kimlik şartı (R2.P1 ile uyumlu) |

---

## Faz R3 — Meta döngü (retention + ticari ürün)

| ID | Çıktı | Durum |
|----|--------|--------|
| R3.1 | XP/sezon bandı — sunucu doğrulamalı | **Tamam:** `meta.v0.1.0.json` BP tier XP + günlük BP XP tavanı; `GET /meta/progress`; tier claim |
| R3.2 | Görev/günlük — gateway ile | **Tamam:** quest tanımları + günlük claim / leaderboard / shop ile ilerleme + `POST /meta/quest/claim` |
| R3.3 | Kozmetik kanalı + Battle Pass ürünleştirmesi (P2W yok; şanslı ücretli mekanik yok) | **Tamam:** BP ödülünde `cosmeticId` örneği + cosmetics API + UI equip |

**Operasyon notu:** Premium BP, üretimde `POST /iap/battle-pass/verify` ile mağaza doğrulaması (kimlik zorunlu). Operatör testi: `KR_ADMIN_TOKEN` + `POST /admin/meta/grant-battle-pass-premium`. Dev-only stub: `KR_IAP_ALLOW_STUB=true` ve makbuz `STUB_PREMIUM`.

---

## Faz R4 — Maç ürünleştirme

| ID | Çıktı | Durum |
|----|--------|--------|
| R4.1 | Maç öncesi/sonrası ekranları ürün UI | **Tamam:** `matchFlowRail` (Prepare → Fight → Result); hazırlık özeti `matchPrepBanner` (A vs B isimleri); sonuçta oyuncu perspektifi **Victory / Defeat / Draw** (`outcomeHero`); arena alt başlığı prep vs replay modunda |
| R4.2 | Replay scrubber + performans | **Tamam:** `aria-valuetext` scrubber; auto-play **requestAnimationFrame** ile tick birikimi (setInterval yerine); klavye: ← → scrub, Home/End, Space auto-play |
| R4.3 | Arena render stabilitesi (Pixi/Canvas) | **Tamam:** companion-web arena **Canvas 2D** — `ResizeObserver` + `devicePixelRatio` (max 2) ile keskin çizim; host genişliğine göre 2:1 responsive (`ArenaCanvas` v0.4.0) |

---

## Faz R5 — Sanat, UI kiti, VFX, ses

| ID | Çıktı | Durum |
|----|--------|--------|
| R5.1 | Art direction + birim sprite setleri | **Tamam:** `visual/artDirection.ts` (`KINDRAIL_ART` tema `nyrvexa_twilight_v1`, rol hex SSOT); mevcut sheet crop + `spriteProfiles` ile uyumlu not |
| R5.2 | UI kiti (responsive + dokunmatik) | **Tamam:** `:root` `--role-*`, `--crit-glow`; `focus-visible` halkası; `(pointer: coarse)` ile **44px** dokunma hedefi (`.btn`, `.gameGateCta`); `.unitHp.crit`; reduced-motion’da kart transition kapatma |
| R5.3 | Olay tabanlı VFX | **Tamam:** `visual/vfxPresets.ts` → `arenaVfxTuning`; `prefers-reduced-motion` ile çizgi/partikül/bob/krit halkası/end wash kısıtlaması; arena strike limiti veri odaklı |
| R5.4 | Ses paketi | **Tamam:** `public/audio/kr_*.wav` (22 kHz PCM, `pnpm gen:sfx` ile üretilir) → `decodeAudioData`; yükleme `preloadSfxSamples` / ilk turdan önce `queueMicrotask` prefetch; hazır değilse osilatör yolu; `kindrail_sfx_muted` + **Sound** anahtarı |

---

## Faz R6 — Kalite ve operasyon

| ID | Çıktı | Durum |
|----|--------|--------|
| R6.1 | E2E smoke + CI gate | **Tamam:** Playwright `apps/companion-web/e2e/smoke.spec.ts` (gate→dashboard, Run battle→Result); `scripts/ci-e2e-smoke.sh`; `kindrail-ci.yml` Chromium + `--with-deps`; yerel `pnpm --filter @kindrail/companion-web run test:e2e` (sunucular script ile veya elle). Onboarding overlay: test `kr_onboarding_v1_done` init |
| R6.2 | Cihaz/OS matrisi | **Tamam:** `docs/R6_DEVICE_MATRIX.md` — CI satırı + manuel Safari/Firefox/Capacitor notları |
| R6.3 | Metrikler ve incident runbook | **Tamam:** `docs/R6_METRICS_AND_INCIDENTS.md` — `/health`, `/metrics`, log audit anahtarları, incident adımları, compose rollback köprüsü |

**Gateway üretim derlemesi:** `tsc` sonrası `services/gateway/scripts/copy-catalogs.mjs` ile `src/content/catalogs/*.json` → `dist/content/catalogs/` (Dockerfile `pnpm … gateway build` ile aynı).

---

## Faz R7 — Mağaza ve uyumluluk (satış için zorunlu)

| ID | Çıktı | Durum |
|----|--------|--------|
| R7.1 | IAP (App Store + Google Play) + receipt / purchase token doğrulama (gateway) | **Tamam (teknik):** companion native IAP + `POST /iap/battle-pass/verify`; canlı SKU ve mağaza sandbox / üretim doğrulaması **operasyon** |
| R7.2 | Gizlilik / kullanım / yaş; rewarded ads varsa platform rıza ve beyan gereksinimleri | **Tamam (teknik):** `GET /legal/public`, `KR_LEGAL_*`, companion `LegalFooter`; mağaza URL metinleri ve yaş işaretleri **yayın operasyonu** |

---

## Faz R8 — Yayın ve live ops

| ID | Çıktı | Durum |
|----|--------|--------|
| R8.1 | Store listeleri + ikon + görsel | **Şablon:** `artifacts/store-listing/` + checklist `docs/R8_LAUNCH_CHECKLIST.md` § R8.1 |
| R8.2 | Prod yedekleme ve izleme | **Tamam:** `deploy/docker-compose.yml` (+ gateway **healthcheck**), `deploy/README.md`, `deploy/scripts/backup-postgres.sh`; gateway **`KR_DATABASE_URL`** ile **Postgres** (`PgStore`), **`GET /health`.`checks.database`**; CI **`docker compose … config`** doğrulaması |

SSOT kontrol listesi: **`docs/R8_LAUNCH_CHECKLIST.md`**. Teknik derinlik: **`docs/PHASE13_PRODUCTION.md`**.

## Faz N (sonra) — Ayrı native istemci

Backend ve `@kindrail/protocol` sabit; yeniden yazılan öncelikle sunum ve platform API’leri. Minimum istemci sürümü politikası.

---

## Hızlı komutlar

```bash
# Yerel oynanabilirlik / ön deneme: bağımlılık + ilk protocol/sdk derlemesi + gateway + web
pnpm run play:local

# Ya da yalnız süreçler (protocol/sdk derlemesi elle yapılmışsa)
pnpm run dev:full

# Ya da iki terminal:
pnpm dev
pnpm run dev:companion

# Mobil paket öncesi web build + sync (platform için apps/companion-mobile/README.md)
pnpm run mobile:sync

# Öncesinde workspace derlemesi: protocol + sdk-ts + companion-web + gateway (`pnpm … build`).
bash scripts/ci-e2e-smoke.sh

# Yalnız Playwright (127.0.0.1:8787 gateway ve :4173 vite preview çalışır durumda olmalı)
pnpm run test:e2e

# Örnek kadro URL’si: ?squad=soldier,archer,knight,mage
```
