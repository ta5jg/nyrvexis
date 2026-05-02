## Faz 0 — Ürün Tanımı + North Star (NYRVEXIS)

Bu doküman Faz 0’ı **tamamlanmış** saymak için gerekli ürün tanımını ve net kararları tek yerde toplar.

---

### North Star (tek cümle)
**NYRVEXIS = ~5–7 dk oturum (sinematik replay + günlük deterministik savaş) + “paylaşılabilir replay” + “koleksiyon/progression”** — arena **operasyonel olarak canlı** okunur (statik sıra auto-battler anti-hedef); web `ArenaCanvas` gönderim, Unity altın sahne aynı JSON ile premium sunum.

---

## 0.1 Ürün vaadi (Value Prop)

### Kullanıcı vaadi
- 60 saniyede bir “günlük savaş” oynarsın.
- Sonucu **link/PNG** ile paylaşır, arkadaşının sonucu ile karşılaştırırsın.
- Ödül alır, koleksiyonunu büyütür, yarın tekrar gelirsin.

### İş vaadi
- Düşük friction → hızlı büyüme.
- UGC-lite (build code + replay) → organik dağıtım.
- Monetization: küçük, net teklif (starter pack) + cosmetics.

---

## 0.2 Core Loop (günlük döngü)

### Core loop (MVP)
1) **Daily battle** (tek tık)
2) **Sonuç** (win/lose + skor)
3) **Ödül** (gold/shards)
4) **Upgrade / Shop**
5) **Share** (link/PNG/X)
6) Ertesi gün tekrar

### Kullanıcı ekranları (MVP)
- Home (Daily + last result + claim)
- Battle (run + replay)
- Collection (units + upgrade)
- Shop (rotation)
- Profile (streak + shares + rank)

---

## 0.3 Meta Loop (koleksiyon + progression)

### Progression hedefi
- Kullanıcı 7 gün içinde “gözle görülür güçlenme” yaşamalı.
- 30 gün içinde “koleksiyon hedefi” oluşmalı (rarity/skin/leaderboard).

### Meta loop (MVP)
- Unit ownership (unlock)
- Unit level (gold sink)
- Star rank (shard sink, koleksiyon hedefi)
- Cosmetic (skin/badge/title)
- **Planet hub:** 4×4 kozmetik ızgara (`slot: hub`), sunucu doğrulamalı yerleştirme (`GET/POST /hub/layout`); yeni hesaba başlangıç parçası + BP ile ek parçalar; **24 saatlik salt okunur paylaşım** (`POST /hub/share` → `?planet=` ile önizleme). Oyun gücünü değiştirmez.

---

## 0.4 Skor / Rekabet modeli

### Daily skor (v0)
- Amaç: hızlı ve açıklanabilir skor.
- Öneri:
  - **Win**: +1000
  - + kalan toplam HP (A tarafı için)
  - - ticks (daha hızlı bitiş daha iyi)

### Leaderboard (v1 plan)
- Global daily leaderboard (seed = `daily:YYYY-MM-DD`)
- Region/locale segmentasyonu (sonra)

---

## 0.5 İçerik model taslağı (Content Tables)

Faz 0 çıktısı olarak “data-driven” yapının iskeletini burada tanımlarız. (Uygulama Faz 1/2’de.)

### UnitArchetype (taslak alanlar)
- `id` (string)
- `nameKey` (localization)
- `role`: tank / dps / support
- `baseStats`: hp/atk/def/spd
- `growth`: level başına artış
- `skillId` (v1)

### Skill (taslak)
- `id`
- `kind`: shield / bleed / stun / taunt
- `params` (int-only)
- `cooldownTicks`

### EconomyTables (taslak)
- `dailyReward`: gold/shards
- `upgradeCost(level)`
- `shopPrices`
- `starterPackOffer`

---

## 0.6 Monetization (MVP)

### İlk gelir hedefi (MVP)
- **Starter Pack**: 1 kez alınır, “hızlı başlangıç” (yüksek value/low price).
- **Cosmetics**: skin/badge/title (pay-to-win değil).

### Teklifler (taslak)
- Starter Pack:
  - premium currency (küçük)
  - 1–2 rare cosmetic
  - upgrade mats (shards)
  - “7-day boost” (soft, limitli)
- Cosmetic Store:
  - günlük/haftalık rotation

### Yasaklar (ürün çizgisi)
- PvP fairness bozan “satın al kazan” yok.
- Güç satılacaksa: cap + leaderboard segmentleri + anti-abuse şart.

---

## 0.7 Anti-abuse sınırları (ne zaman sertleşiyoruz?)

Faz 0’da net kural: “growth hızlı” ama “ödül/para girince” doğrulama sertleşir.

### Aşama A (şimdi: viral prototip)
- Replay link tamamen public.
- Battle sim gateway’de koşuyor (mevcut) → istemci manipülasyonu az.
- Rate limit (IP) yeterli.

### Aşama B (ödül var: daily claim)
- Daily claim için:
  - device/user ID
  - idempotency (aynı gün 1 kez)
  - basit bot guard (rate + heuristics)

### Aşama C (para var: purchase)
- Receipt validation server-side
- Inventory updates transactional
- Abuse monitoring + ban/quarantine

---

## 0.8 KPI sözlüğü (ölçüm tanımları)

### Acquisition / Growth
- **Share rate**: battle completed → share action (%)
- **Share→new conversion**: share link open → first battle run (%)
- **K-factor** (referral v1): invite acceptance / user

### Retention
- **D1/D7 retention**: first session günü +1/+7 geri dönüş
- **Daily streak**: üst üste günlük battle

### Monetization
- **Conversion rate**: first purchase %
- **ARPDAU / ARPPU**

### Product speed
- **Time-to-first-battle**: landing → first sim run (seconds)

---

## 0.9 Faz 1’e geçiş kriteri (Definition of Done)

Faz 0 “tamam” sayılması için:
- Core loop + meta loop + monetization + anti-abuse sınırı yazılı ve repo’da
- KPI tanımları sabit
- Faz 1 backlog’u net (hangi endpoint/UI/sim geliştirmeleri)

Bu doküman bunu sağlar; sonraki adım Faz 1’in “UI polish + replay viewer + ability v1” üretimine geçmektir.

