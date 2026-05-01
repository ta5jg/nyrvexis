<!-- =============================================================================
File:           docs/KINDRAIL_RELEASE_ROADMAP.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-05-01
Version:        1.2.0

Description:
  Kindrail → yayına kadar fazlı plan (web + Capacitor mobil önce; ayrı native sonra).
  v1.1: Ticari model (SSOT) + R3/R7 ile hizalı ticari MVP checklist.
  v1.2: R1 tamamlandı — kabuk, dokümantasyon, CI kapısı, squad deep link.

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

- [ ] **R3.M1** — Sezon / Battle Pass tanımı: süre, ücretsiz hat, premium hat, ödül tablosu (şema + gateway).
- [ ] **R3.M2** — Kozmetik envanter modeli: SKU listesi, sahiplik, takma/görünür seçim (protocol + gateway).
- [ ] **R3.M3** — Günlük görev / yeniden giriş hedefleri (isteğe bağlı ilk sürümde kısıtlı set).
- [ ] **R3.M4** — Oyuncu panelinde mağaza ve Pass UI (web + mobil düzen; dokunmatik öncelikli).
- [ ] **R3.M5** — Ekonomi kötüye kullanım sınırları: hız sınırı, tutarsız grant reddi, temel audit log.

### R7 — Mağaza, ödeme doğrulama, reklam uyumu

- [ ] **R7.M1** — **Apple** ve **Google Play** IAP entegrasyonu (ürün kimlikleri, fiyat katmanları, test sandbox).
- [ ] **R7.M2** — **Receipt / Purchase Token doğrulaması** gateway’de; ödeme olmadan premium içerik açılmaz.
- [ ] **R7.M3** — Gizlilik politikası, kullanım şartları, hesap silme / veri talepleri süreci (store gereksinimleri ile uyumlu).
- [ ] **R7.M4** — Yaş derecelendirmesi ve içerik beyanı (şiddet / satın alma / reklam işaretleri).
- [ ] **R7.M5** — Rewarded ads kullanılıyorsa: SDK seçimi, **ATT / ATT benzeri şeffaflık**, Android için uygun rıza akışı; reklamın **isteğe bağlı** ve güç satmayan ödüllerle sınırlı olduğunun doğrulanması.

### Bundle kampanyaları ve operasyon

- [ ] **BD.M1** — Kampanya takvimi şablonu (başlangıç paketi, sezon açılışı, tema bundle).
- [ ] **BD.M2** — Mağaza metadata’sı: her bundle için sabit içerik listesi ve yerelleştirme anahtarları.

### R2 ön koşul (satın alma güvenliği)

Ödeme hesaba bağlanmadan yapılıyorsa **kayıp satın alma / cihaz değişimi** riski yüksektir. Üretim öncesi hedef:

- [ ] **R2.P1** — Misafir → kalıcı hesap bağlama veya doğrudan kayıtlı kullanıcı ile ilk IAP akışı.

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

| ID | Çıktı |
|----|--------|
| R2.1 | OAuth veya email ile kayıt/giriş |
| R2.2 | Refresh token + güvenli mobil saklama |
| R2.3 | Misafir → hesap bağlama (politika) |

---

## Faz R3 — Meta döngü (retention + ticari ürün)

| ID | Çıktı |
|----|--------|
| R3.1 | XP/sezon bandı — sunucu doğrulamalı |
| R3.2 | Görev/günlük — gateway ile |
| R3.3 | Kozmetik kanalı + Battle Pass ürünleştirmesi (P2W yok; şanslı ücretli mekanik yok) |

---

## Faz R4 — Maç ürünleştirme

| ID | Çıktı |
|----|--------|
| R4.1 | Maç öncesi/sonrası ekranları ürün UI |
| R4.2 | Replay scrubber + performans |
| R4.3 | Arena render stabilitesi (Pixi/Canvas) |

---

## Faz R5 — Sanat, UI kiti, VFX, ses

| ID | Çıktı |
|----|--------|
| R5.1 | Art direction + birim sprite setleri |
| R5.2 | UI kiti (responsive + dokunmatik) |
| R5.3 | Olay tabanlı VFX |
| R5.4 | Ses paketi |

---

## Faz R6 — Kalite ve operasyon

| ID | Çıktı |
|----|--------|
| R6.1 | E2E smoke + CI gate |
| R6.2 | Cihaz/OS matrisi |
| R6.3 | Metrikler ve incident runbook |

---

## Faz R7 — Mağaza ve uyumluluk (satış için zorunlu)

| ID | Çıktı |
|----|--------|
| R7.1 | IAP (App Store + Google Play) + receipt / purchase token doğrulama (gateway) |
| R7.2 | Gizlilik / kullanım / yaş; rewarded ads varsa platform rıza ve beyan gereksinimleri |

---

## Faz R8 — Yayın ve live ops

| ID | Çıktı |
|----|--------|
| R8.1 | Store listeleri + ikon + görsel |
| R8.2 | Prod yedekleme ve izleme |

---

## Faz N (sonra) — Ayrı native istemci

Backend ve `@kindrail/protocol` sabit; yeniden yazılan öncelikle sunum ve platform API’leri. Minimum istemci sürümü politikası.

---

## Hızlı komutlar

```bash
# Tek komut: gateway + web (repo kökünde concurrently)
pnpm run dev:full

# Ya da iki terminal:
pnpm dev
pnpm run dev:companion

# Mobil paket öncesi web build + sync (platform için apps/companion-mobile/README.md)
pnpm run mobile:sync

# Örnek kadro URL’si: ?squad=soldier,archer,knight,mage
```
