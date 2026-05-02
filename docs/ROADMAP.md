<!-- =============================================================================
File:           docs/ROADMAP.md
Author:         USDTG GROUP TECHNOLOGY LLC
Developer:      Irfan Gedik
Created Date:   2026-04-30
Last Update:    2026-05-02
Version:        0.3.2

Description:
  

License:
  Proprietary. All rights reserved. See LICENSE in the repository root.
============================================================================= -->

## NYRVEXIS Roadmap (v0)

Release phases (web + Capacitor → store): **`docs/NYRVEXIS_RELEASE_ROADMAP.md`**.  
Rakip seviyesi combat + ekosistem parity özeti: **`docs/FULL_PRODUCT_PARITY_ROADMAP.md`**.  
Final teslimat sırası (checklist): **`docs/NYRVEXIS_FINAL_SHIP_STEPS.md`**.

**Ticari model ve satılabilir MVP checklist** (Battle Pass + kozmetik IAP + opsiyonel rewarded ads + bundle; şans/kumar yok): aynı dosyada *Ticari model (SSOT)* ve *Ticari MVP checklist* bölümleri.

Bu doküman “NYRVEXIS’i hızlı büyüyen ve para kazanan bir ürüne” dönüştürmek için fazları, alt kırılımları ve teknik adımları tanımlar.

### Prensipler
- **Web-first**: en hızlı iterasyon ve paylaşılabilirlik.
- **SSOT protocol**: client↔gateway payload’ları tek şema kaynağından türetilir.
- **Determinism**: aynı input + seed ⇒ aynı battle sonucu (replay/share için kritik).
- **Growth önce**: friction düşük, paylaşım kolay, günlük hedef net.
- **Security & anti-abuse**: para ve ödül girince sıkılaşır (kademeli).

### Sunum omurgası (revize)
- **Gateway** deterministik sim + olay akışı tek SSOT.
- **Web** (`ArenaCanvas`): gönderilebilir, hafif, okunaklı operasyonel sahne (hareket + manevra + vuruş geri bildirimi).
- **Unity** (`apps/game-unity`): aynı battle export JSON → altın sahne; **Idle / Advance / Attack / Hit / Death** Animator sözleşmesi; mobil/WebGL opsiyonel (`pnpm run unity:golden-export`).

---

## Faz 0 — Ürün Tanımı + North Star

### Hedef
- “1 dakikada oynanır, paylaşılır, ertesi gün geri gelinir.”

See: `docs/PHASE0_PRODUCT.md`

### Çıktılar (deliverables)
- **Core loop** 1 sayfa: “Daily battle → reward → upgrade → tekrar”
- **Meta loop** 1 sayfa: koleksiyon, rarity, progression
- **Monetization** 1 sayfa: starter pack + cosmetics (MVP), battle pass (sonra)
- **Anti-abuse sınırı** 1 sayfa: hangi noktada server-side doğrulama zorunlu

### Ölçümler (KPI)
- **D1 retention**, **D7 retention**
- **Share rate**: battle sonrası paylaşım oranı
- **Time-to-first-battle**: ilk battle’a kaç saniye

---

## Faz 1 — Vertical Slice (oynanır + paylaşılır)

### Hedef
- “Günlük battle” + replay + tek tık paylaşım. Kullanıcı “oyunu anladı ve paylaştı” diyebilmeli.

### Alt sistemler

#### 1.1 Battle sim v1 (deterministic)
- **Unit model**
  - Statlar: `hp/atk/def/spd`, crit (mevcut)
  - **Formation**: ön/arka sıra (2 hat) + hedefleme önceliği
- **Abilities v1 (2–4 archetype)**
  - Örnek: `shield`, `bleed`, `stun`, `taunt`
  - Event’ler: `status_apply`, `status_tick`, `shield_break`
- **Replay**
  - Event listesi: time/tick, src/dst, dmg, status
  - Deterministik doğrulama: aynı request aynı event stream

#### 1.2 Web client v1
- **Battle setup UI**
  - JSON edit yerine: unit kartları + formation edit
  - “Randomize” + “Daily” + “Run”
- **Replay viewer**
  - Timeline scrub + event log
  - Basit animasyon: HP bar değişimi + death highlight
- **Share**
  - Share link (mevcut)
  - **Share card PNG** (mevcut)
  - X share intent (mevcut)

#### 1.3 Gateway v1
- **Endpoints**
  - `GET /health`
  - `GET /daily-seed`
  - `POST /sim/battle`
- **Hardening (min)**
  - Request size cap
  - Rate limit (IP bazlı; sonra user/device)
  - Structured logs (traceId)

### KPI
- **Share rate**: “Run battle” sonrası share aksiyonu
- **Replay open rate**: linkten gelenlerin battle’ı çalıştırma oranı

---

## Faz 2 — Hesap + Envanter (MVP ekonomi)

### Hedef
- Kullanıcının ilerlemesi kalıcı olsun. Günlük ödül ve basit progression başlasın.

### Alt sistemler

#### 2.1 Auth v1
- **Guest account**
  - deviceId → server-side userId
  - session token (kısa ömür + refresh)
- **Threat model v1**
  - replay tamper: request + signature (sonra)
  - rate limit: IP + device

#### 2.2 Inventory v1
- Para birimleri: `gold`, `shards`, `keys`
- Koleksiyon: unit ownership + unit level
- “Daily claim”
  - daily seed oynandı mı?
  - reward verildi mi?

#### 2.3 Persistence
- DB: Postgres (öneri) + migrations
- Backup/restore prosedürü

### KPI
- **D1 retention** artışı (daily claim etkisi)
- **Economy sink/source** dengesi (gold üretim/tüketim)

---

## Faz 3 — Meta: Koleksiyon + Progression

### Hedef
- “Bir şeyler birikiyor, güçleniyorum, yeni birim açıyorum.”

### Alt sistemler
- **Shop**
  - deterministic shop rotation (UTC saatlik/günlük)
  - pricing table (config-driven)
- **Upgrade**
  - level up: gold + shard
  - star rank: koleksiyon milestone
- **Content tables**
  - JSON config + versioning + rollback

### KPI
- **Session/day**
- **Progression depth**: 7 gün içinde ortalama unit level

---

## Faz 4 — Growth Loop (viral + retention)

### Hedef
- Paylaşım + rekabet + günlük hedef ile organik büyüme.

See: `docs/PHASE4_GROWTH.md`

### Alt sistemler
- **Daily leaderboard**
  - skor metriği: kalan HP + ticks + streak
  - anti-abuse: replay doğrulama / server-run sim (sonra)
- **Referral**
  - invite link + reward (caps)
- **UGC-lite**
  - “Build code” paylaşımı (deck+formation)

### KPI
- **K-factor** (referral)
- **Share-to-new-user conversion**

---

## Faz 5 — Monetization MVP

### Hedef
- İlk gelir: starter pack + cosmetics + küçük bundle.

### Alt sistemler
- **Payments**
  - Web: Stripe
  - Mobile (sonra): store IAP
- **Receipt validation**
  - server-side doğrulama
  - idempotency (aynı ödeme iki kez işlenmesin)
- **Fraud / abuse guard**
  - anomaly detection (yüksek claim / hızlı purchase)

### KPI
- **ARPPU**, **ARPDAU**
- **Conversion rate** (first purchase)

---

## Faz 6 — LiveOps + Ölçek + Güvenlik

### Hedef
- Stabil canlı servis: deploy güvenli, metrikler görünür, kötüye kullanım kontrollü.

### Alt sistemler
- Observability: logs/metrics/traces
- Rate limits (user/device/IP)
- Feature flags + canary
- Content pipeline (versioned)

---

## Faz 7 — Native / Unity sunumu (opsiyonel, web ile paralel)

### Hedef
- Web + Capacitor mağaza gönderimi **birincil** kalırken, **Unity** ile aynı protokol üzerinden **yüksek çubuklu arena** (rig + VFX) üretmek; “heykel gibi ateş” algısını kırmak.

### Alt sistemler
- Unity paketi: replay SSOT JSON → `NyrvexisReplayDirector` + beş durum Animator (`apps/game-unity`)
- İsteğe bağlı: Unity WebGL veya mağaza ikilisi — gateway/API değişmez
- Native mobil özellikleri: push, offline-friendly UI — Capacitor ile örtüşür veya Faz N’de genişler

See: `docs/PHASE7_NATIVE.md`, `docs/FULL_PRODUCT_PARITY_ROADMAP.md` (R10)

---

## Faz 8–14 — Full game roadmap (v1)

See: `docs/ROADMAP_V1_FULL.md`  
**Faz 13 (prod deploy + Postgres + backup + analytics ingest):** `docs/PHASE13_PRODUCTION.md`  
**R8 yayın checklist:** `docs/R8_LAUNCH_CHECKLIST.md`

---

## “Şimdi ne yapıyoruz?” (en kısa kritik yol)
1) Faz 8 (v1) companion-web: squad builder + onboarding + replay HP + auto-play + SFX ✅
2) Faz 2 “guest auth + inventory minimal” (daily claim) ✅
3) Faz 5 “starter pack” (ilk gelir) ✅
4) Faz 4 “leaderboard + referral” (büyüme) ✅
5) **R10** Unity altın sahne: **rig + gerçek clip’ler (P5)** kaldı; companion export (P6 ✅); presentation SSOT (P7 ✅)

