## NYRVEXIS — “Full Game” Roadmap (v1)

Bu doküman, Faz 0–7’nin üstüne “oyuncunun **tam oyun** diyeceği” seviyeye gelmek için gerekli fazları tanımlar.

Tanım (v1.0 hedefi):
- Oyuncu **deck/formation** kurar
- “Daily run” + “retry/optimize” + “rank/season progression” ile haftalarca kalır
- İçerik derinliği (unit/synergy/augment) **tekrar oynanabilirlik** yaratır
- Ödeme/anti-abuse/operasyon tarafı prod seviyesine yaklaşır

> Not: Faz 0–7 = iskelet + MVP ürün hattı. Aşağıdakiler = “oyun hissi + içerik + retention motoru + prod launch”.

---

## Faz 8 — Game-feel UX (oyun gibi hissettir)

### Hedef
- “Bu bir tool değil, oyun.” Battle izlenebilir, kararlar anlaşılır, onboarding akıcı.

### Deliverables
- **Deck/formation builder UI** ✅ (companion-web: 4 slot squad + enemy preset; JSON “advanced” olarak)
- **Onboarding v1** ✅ (ilk açılış modal + localStorage)
- **Replay viewer v2** ✅ (tick başına HP ileri sarma + vuruş flash + auto-play + 1×/2×/4×)
- **Audio/VFX lite** ✅ (WebAudio hit/death/win; VFX = flash ring)

### KPI
- **Time-to-first-win** < 90sn
- **Completion rate** (onboarding) > 60%
- **Daily battle click** > 40% (ilk oturum)

### Teknik checklist
- UI state machine (idle/loading/result/error) sadeleştirme
- Deterministic replay event → UI animation mapping
- “view/run” deep linkleri onboarding ile uyumlu

### Exit criteria
- Yeni kullanıcı 2 dk içinde daily run + claim + 1 satın alma + 1 upgrade yapabiliyor.

---

## Faz 9 — İçerik v1 (meta’yı taşıyacak hacim)

### Hedef
- Tek bir “soldier/brute/archer/rogue” seti yetmez: sinerji + çeşitlilik.

### Deliverables
- **20–40 unit archetype**
- **Sinerji setleri** (örn. 6 set × 3 seviye bonus)
- **Augment/Item v1**
  - run başına 1–3 seçim (deterministic)
- **Enemy variations**
  - daily seed’e bağlı varyant havuzu

### KPI
- **Replay variety**: ilk 7 günde farklı archetype kullanım oranı
- **Return-to-optimize**: aynı daily’e tekrar girme oranı

### Teknik checklist
- Content schema genişletme (units + synergies + augments)
- Content versioning/rollback pipeline genişletme
- Sim event’lerine “choice/augment” eventleri

### Exit criteria
- Aynı seed’de en az 5 farklı “viable build” çıkıyor.

---

## Faz 10 — Progression v2 (retention motoru)

### Hedef
- Oyuncu her gün “yapacak iş” görür: quest + streak + hedef.

### Deliverables
- **Daily/weekly quests**
- **Streak system** (kaçırınca düşer, küçük “catch-up”)
- **Battle pass (lite)**
  - ücretsiz tier + küçük premium (sonra büyür)
- **Reward tuning table**

### KPI
- **D1/D7/D30** hedefleri (ürüne göre)
- **Sessions/day** ve **quest completion**

### Teknik checklist
- Quest definitions (content) + claim endpoints
- Anti-abuse caps + idempotency key
- UI: progress bar + claim UX

### Exit criteria
- 7 gün boyunca her gün açınca “hedef + ödül” net.

---

## Faz 11 — Economy + Balancing Toolchain

### Hedef
- Economy rastgele değil: simüle edilir, ayarlanır, A/B ile denenir.

### Deliverables
- **Economy simulator script**
  - kaynak/sink, upgrade maliyetleri, reward curve
- **Admin balance panel (v1)**
  - content version switch + pricing/reward override
- **A/B (flag) planı**
  - 2–3 ana parametre: reward, shop price, shard curve

### KPI
- **Inflation control**: gold/shard birikimi hedef aralıkta
- **Conversion uplift** (starter pack etkisi)

### Teknik checklist
- Config-driven economy tables
- Safe rollout: canary + rollback prosedürü

### Exit criteria
- “Bir parametre değişti → 1 gün içinde ölçüldü → rollback mümkün.”

---

## Faz 12 — Anti-abuse / Validation (prod’e yaklaş)

### Hedef
- Leaderboard + ödeme + ödül: hile ve abuse’a dayanıklı hale gelir.

### Deliverables
- **Server-side validation path**
  - leaderboard submit: server-run sim + signature
- **Receipt validation (real)**
  - Stripe webhooks signature verify
  - Mobile IAP receipts (sonra)
- **Fraud guardrails**
  - claim spam, referral spam, push spam caps

### KPI
- Abuse oranı düşer (anomali alertleri)
- Leaderboard güvenilirliği

### Teknik checklist
- Raw body webhook signature verification
- Idempotency keys everywhere
- Abuse counters → metrics + alerts

### Exit criteria
- “Replay tamper” ile score şişirme pratikte engellenmiş.

---

## Faz 13 — Production Launch (deploy + data)

### Hedef
- Lokal değil: deploy edilebilir, izlenebilir, geri alınabilir.

### Deliverables
- **Prod hosting** (gateway + web)
- **DB geçişi** (Postgres + migrations) *(FileStore → DB)*
- **Backups + restore drills**
- **Analytics pipeline**
  - event schema + ingestion + dashboard

### KPI
- Crash-free, error rate, p95 latency
- Funnel: onboarding → daily → claim → shop → upgrade

### Teknik checklist
- Infra as code (minimum)
- Secrets management
- Observability: logs/metrics + alert rules

### Exit criteria
- “1 tık deploy + rollback” ve veri kaybı olmadan restore denemesi.

---

## Faz 14 — Seasons + LiveOps Content Factory

### Hedef
- Oyun “sürekli ürün”: sezon döngüsü + etkinlik + içerik akışı.

### Deliverables
- **Sezon sistemi**
  - season id, reset rules, season rewards
- **Limited-time events**
  - 7–14 gün mini event’ler
- **Content factory**
  - içerik üretimi → test → version bump → deploy
- **Ops runbooks**
  - incident, rollback, abuse response

### KPI
- Season retention uplift
- Event participation

### Teknik checklist
- Season state + reset jobs
- Content QA checklist + automated validation

### Exit criteria
- 1 sezonu baştan sona yönetebiliyorsun (start → liveops → end → reward → reset).

---

## Minimum vs Ideal
- **Minimum “oyun gibi” v1.0**: Faz 8–12
- **Ticari canlı servis v1.0**: Faz 8–14

