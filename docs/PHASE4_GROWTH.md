## Faz 4 — Growth Loop (viral + retention)

Bu doküman Faz 4’ün “büyüme motorunu” tanımlar: **Daily leaderboard**, **referral**, **UGC-lite build code**, **share→reward** ve bunların **anti‑abuse** sınırları.

> Not: Faz 4’te amaç “en hızlı büyüme” olduğu için sistemleri önce **basit + ölçülebilir** kurarız, sonra abuse ve ölçekleme sertleşir.

---

## 4.1 North Star Growth Loop

### Döngü
1) Kullanıcı **Daily battle** oynar  
2) Skor çıkar → **leaderboard** güncellenir  
3) Kullanıcı sonucu **paylaşır** (link/PNG/X)  
4) Yeni kullanıcı linkten gelir → aynı daily’yi oynar  
5) Her iki taraf küçük bir ödül alır (opsiyonel)  
6) Ertesi gün tekrar (streak)

### “Shareable payload”
Paylaşımın içinde taşınabilenler:
- `seed` (daily)
- `request` (battle setup / build code)
- `resultSummary` (isteğe bağlı; güvenilmez, sadece UX için)

---

## 4.2 Daily Leaderboard

### Hedef
- Her gün tek bir “global challenge” olsun.
- Kullanıcı tek bakışta “bugün kaçıncıyım”ı görsün.

### Skor modeli (v0 — açıklanabilir)
Önerilen skor:
- **Win**: +1000
- + kalan toplam HP
- - ticks

\[
score = (win?1000:0) + remainingHp - ticks
\]

### Anti‑abuse (v0)
V0’da leaderboard skorunu **gateway hesaplar**:
- Client sadece request gönderir.
- Gateway `POST /sim/battle` ile sim çalıştırır.
- Leaderboard’a yazılan skor: **server output**.

### Segmentasyon (sonra)
- global + locale/region
- new player bracket
- power bracket (koleksiyon gücüne göre)

---

## 4.3 Referral

### Hedef
- K‑factor’ı artırmak (organik büyüme).

### Referral link biçimi
- `?ref=<referrerUserId>`

### Ödül kuralı (v0)
- Yeni kullanıcı ilk battle’ını tamamlayınca:
  - New user: +X gold / +Y shards
  - Referrer: +X gold / +Y shards

### Anti‑abuse (v0)
- Her kullanıcı için günlük referral reward cap
- Aynı deviceId/IP’den spam engeli (heuristic)

---

## 4.4 UGC-lite: Build Code

### Hedef
- “Bu build çok iyi” paylaşılsın.
- Link tıklayan kişi 1 tıkla aynı build’i deneyebilsin.

### Build code formatı
- URL param: `q=<base64url(json)>`
- JSON: battle request’e benzer ama “player build” olarak normalize edilir:
  - units + slots
  - level/star (Faz 3’ten)

### Anti‑abuse
- Build code sadece yapılandırma içerir, token/secret içermez.

---

## 4.5 Share → Reward (opsiyonel)

### Amaç
- Paylaşımı “davranış” olarak güçlendirmek.

### Kural (v0)
- Kullanıcı battle sonrası share aksiyonu yaparsa “share ticket” oluşur.
- Ticket link üzerinden yeni kullanıcı battle tamamlayınca “share reward” verilir.

### Anti‑abuse (v0)
- ticket TTL (örn 24 saat)
- per-user daily cap
- same user self-redeem engeli

---

## 4.6 Gateway API (önerilen)

### Leaderboard
- `POST /leaderboard/submit`  
  - input: seed + build + (optional) runSim request
  - output: rank + score + percentile
- `GET /leaderboard/daily?date=YYYY-MM-DD&limit=50`
- `GET /leaderboard/me?date=YYYY-MM-DD`

### Referral
- `POST /referral/accept` (auto: first session’da ref param’dan)
- `GET /referral/status`

### Share tickets
- `POST /share/ticket`
- `POST /share/redeem`

---

## 4.7 Data model (v0)

### LeaderboardEntry
- `dateUtc`
- `userId`
- `score`
- `ticks`
- `remainingHp`
- `buildHash`
- `createdAtMs`

### ReferralEdge
- `referrerUserId`
- `newUserId`
- `createdAtMs`
- `rewardedAtMs?`

### ShareTicket
- `ticketId`
- `issuerUserId`
- `dateUtc`
- `createdAtMs`
- `redeemedByUserId?`
- `redeemedAtMs?`

---

## 4.8 KPI (ölçüm tanımları)

### Growth
- **Share rate**: battle complete → share action (%)
- **Share→new conversion**: link open → first battle run (%)
- **K‑factor**: referral acceptance/user

### Retention
- **D1/D7 retention**
- **Daily streak** dağılımı

### Quality
- **Time-to-first-battle**
- **Crash-free sessions**

---

## 4.9 Faz 4 Definition of Done

Faz 4 “tamam” sayılması için:
- Daily leaderboard çalışır (submit + top list + me)
- Referral link + reward + cap çalışır
- Build code paylaşımı çalışır (import/run)
- Minimum anti‑abuse kuralları (cap + TTL + heuristics) devrede
- KPI event’leri/log’ları tanımlı

