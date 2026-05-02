# 🎮 Nyrvexa – Async Auto-Battler + Collection Meta Cursor Cookbook

## 📌 Amaç
Bu dosya, **5–7 dakikalık maçlar**, **takım kurma**, **kombo keşfi**, **koleksiyon meta**, **sezon sistemi**, **ranked ladder** ve **kozmetik odaklı monetization** içeren bir oyun için Cursor AI kullanım rehberidir.

Hedef: Unity ile hızlı prototip üretmek, Web ve mobil dağıtıma uygun, P2W olmayan, streamer dostu ve ölçeklenebilir bir oyun geliştirmek.

---

# 🧠 1. GAME VISION & CORE LOOP

## 🎯 Core Game Vision
```text
Act as a senior game designer. Design the core vision for an asynchronous auto-battler with collection meta, 5–7 minute matches, team-building depth, combo discovery, ranked ladder, seasonal progression, and cosmetic-only monetization. Keep the game fair, readable, and streamer-friendly.
```

## 🔁 Core Gameplay Loop
```text
Design a clear core gameplay loop for an asynchronous auto-battler. Include collection management, team building, matchmaking, battle simulation, rewards, progression, ranked ladder updates, and cosmetic unlocks.
```

## ⏱️ 5–7 Minute Match Structure
```text
Design a 5–7 minute match structure for an auto-battler. Include preparation phase, opponent preview, battle rounds, power spikes, comeback mechanics, and end-of-match rewards.
```

---

# ⚔️ 2. AUTO-BATTLER COMBAT SYSTEM

## 🤖 Battle Simulation
```text
Act as a senior Unity gameplay programmer. Design a deterministic asynchronous battle simulation system for an auto-battler. Include unit stats, targeting, attack timing, abilities, status effects, cooldowns, and battle result generation.
```

## 🧩 Combo System
```text
Design a combo and synergy system for an auto-battler. Include class synergies, faction bonuses, trait thresholds, hidden combos, counter-combos, and balance considerations.
```

## 🛡️ Unit Roles
```text
Design unit roles for an auto-battler including tank, assassin, support, ranged damage, summoner, controller, healer, and specialist. Explain how each role affects team composition and match pacing.
```

## ⚖️ Combat Balance
```text
Analyze this auto-battler combat system for balance issues. Identify overpowered strategies, weak units, snowball risks, RNG problems, and suggest fair improvements.
```

---

# 🧬 3. COLLECTION META

## 🃏 Collection System
```text
Design a collection meta system for an auto-battler. Include unlockable units, cosmetic variants, rarity tiers, non-pay-to-win progression, collection goals, duplicate handling, and player motivation.
```

## 🔓 Unlock System
```text
Design a fair unit unlock system that avoids pay-to-win. Include player progression, seasonal rewards, achievements, collection milestones, and optional cosmetic purchases.
```

## 🎒 Inventory & Cosmetics
```text
Create a Unity-friendly inventory system for cosmetics. Include skins, emotes, boards, victory effects, avatars, frames, banners, and rarity metadata.
```

---

# 🏆 4. RANKED LADDER & SEASONS

## 📈 Ranked System
```text
Design a ranked ladder system for an asynchronous auto-battler. Include MMR, visible ranks, promotion, demotion protection, placement matches, win streaks, and fair matchmaking.
```

## 🗓️ Season System
```text
Design a seasonal progression system. Include season pass, ranked reset, cosmetic rewards, balance patches, new units, limited events, and end-of-season rewards.
```

## 🧪 Matchmaking Rules
```text
Design matchmaking rules for a short-session asynchronous auto-battler. Include player rank, team power, recent performance, queue time, and anti-abuse protection.
```

---

# 🎥 5. STREAMER-FRIENDLY DESIGN

## 📺 Streamer Hooks
```text
Suggest streamer-friendly mechanics for an asynchronous auto-battler. Include surprising combos, clutch moments, readable battles, shareable replays, spectator value, and community challenges.
```

## 🔁 Replay System
```text
Design a lightweight replay system for an auto-battler. Include deterministic battle playback, seed storage, team snapshots, combat log, timeline controls, and shareable replay links.
```

## 😲 Viral Moments
```text
Design viral gameplay moments for a collection-based auto-battler. Focus on unexpected synergies, rare cosmetic effects, clutch wins, legendary units, and funny battle outcomes.
```

---

# 💰 6. MONETIZATION WITHOUT P2W

## 🎨 Cosmetic Monetization
```text
Design a cosmetic-only monetization system for an auto-battler. Include skins, arenas, animations, emotes, banners, finishers, battle passes, bundles, and limited-time cosmetics without affecting gameplay power.
```

## 🚫 Anti-P2W Check
```text
Analyze this monetization system and identify anything that could feel pay-to-win. Suggest changes to keep the economy fair, ethical, and player-friendly.
```

## 🎟️ Battle Pass
```text
Design a fair seasonal battle pass for an auto-battler. Include free rewards, premium cosmetic rewards, weekly missions, catch-up mechanics, and no gameplay power advantage.
```

---

# 🧱 7. UNITY ARCHITECTURE

## 📂 Unity Folder Structure
```text
Suggest a clean Unity folder structure for an asynchronous auto-battler with collection meta, ranked seasons, cosmetics, battle simulation, UI, data configs, and backend integration.
```

## 🧠 ScriptableObject Data Design
```text
Design a ScriptableObject-based data system for units, abilities, traits, cosmetics, seasons, ranks, and rewards in Unity. Keep it scalable and designer-friendly.
```

## 🧩 Modular Systems
```text
Refactor this Unity project into modular systems: BattleSystem, TeamBuilder, CollectionSystem, EconomySystem, RankedSystem, SeasonSystem, CosmeticSystem, ReplaySystem, and UIManager.
```

---

# 🕹️ 8. PROTOTYPE PLAN

## 🚀 First Playable Prototype
```text
Create a 2-week Unity prototype plan for an asynchronous auto-battler. Include minimum viable features: team builder, 8 units, 3 traits, battle simulation, simple rewards, basic UI, and local testing.
```

## ✅ MVP Feature List
```text
Define the MVP feature list for this game. Separate must-have, should-have, could-have, and later features. Keep the first version small but fun.
```

## 🧪 Vertical Slice
```text
Design a vertical slice for this game that proves the core fun. Include battle readability, team-building choices, combo discovery, short match duration, and post-match progression.
```

---

# 📱 9. WEB & MOBILE DISTRIBUTION

## 📲 Mobile UX
```text
Design the mobile UX for a 5–7 minute asynchronous auto-battler. Include team building, drag-and-drop unit placement, quick battle preview, rewards screen, collection screen, and ranked progress.
```

## 🌐 WebGL Optimization
```text
Optimize this Unity auto-battler for WebGL. Focus on loading time, asset size, memory usage, UI responsiveness, deterministic simulation, and mobile browser constraints.
```

## ⚡ Performance Audit
```text
Analyze this Unity project for performance problems on mobile and WebGL. Suggest optimizations for assets, UI, battle simulation, object pooling, animations, and memory usage.
```

---

# 🧪 10. DEBUGGING & TESTING

## 🐛 Bug Detection
```text
Analyze this Unity C# code for bugs, race conditions, null references, state issues, bad architecture, and hidden edge cases. Suggest safe fixes.
```

## 🧪 Battle Simulation Tests
```text
Create unit tests for this auto-battler battle simulation. Test targeting, ability triggers, cooldowns, status effects, damage calculation, win conditions, and deterministic outcomes.
```

## 🔁 Determinism Check
```text
Review this battle simulation and make it deterministic. Replace uncontrolled randomness with seeded RNG and ensure the same input always produces the same battle result.
```

---

# 🧠 11. AI & BALANCING TOOLS

## 🤖 Bot Opponents
```text
Design bot opponent generation for an asynchronous auto-battler. Include beginner bots, meta-like bots, counter-team bots, seasonal bots, and difficulty scaling.
```

## 📊 Balance Simulator
```text
Design a balance simulation tool that runs thousands of battles between team compositions and reports win rates, overpowered combos, weak units, and meta diversity.
```

## 📉 Meta Health Analysis
```text
Analyze this game's meta health. Check diversity, dominant strategies, counterplay, unit usage rates, trait strength, and player frustration risks.
```

---

# 🧾 12. CURSOR REFACTOR PROMPTS

## 🔄 Clean Refactor
```text
Refactor this code into clean, modular, readable Unity C# architecture. Preserve behavior but improve naming, responsibility separation, testability, and performance.
```

## 🧱 Split Large Script
```text
This Unity script is too large. Split it into smaller components with clear responsibilities. Explain the new architecture and provide the updated files.
```

## 🧼 Remove Technical Debt
```text
Review this system for technical debt. Identify messy dependencies, duplicated logic, hardcoded values, poor naming, and future scaling risks. Suggest a cleanup plan.
```

---

# 🧭 13. DEVELOPMENT RULES

## Cursor Kullanım Kuralları
- Her promptta rol ver: `Act as a senior Unity gameplay programmer.`
- Büyük sistemi tek seferde isteme.
- Önce veri modelini kur.
- Sonra simülasyonu kur.
- Sonra UI bağla.
- Her sistemi ayrı test et.
- Önce eğlenceyi kanıtla, sonra grafik kalitesini artır.

## Önerilen İlk Sıra
1. Unit data system
2. Trait/combo system
3. Team builder
4. Deterministic battle simulation
5. Result screen
6. Collection rewards
7. Ranked mock system
8. Season pass mock
9. Cosmetic inventory
10. Web/mobile optimization

---

# 🏁 Sonuç
Bu cookbook ile Nyrvexa'yı şu yöne taşıyabilirsin:

- Kısa ve bağımlılık yapan maçlar
- Streamer dostu kombo keşfi
- Güçlü koleksiyon meta
- P2W olmayan kozmetik ekonomi
- Sezonluk canlı oyun yapısı
- Unity ile hızlı prototip
- Web ve mobil dağıtıma uygun mimari

---

