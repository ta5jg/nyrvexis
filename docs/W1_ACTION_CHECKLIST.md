# Hafta 1 — Senin (Irfan) Yapman Gereken Adımlar

Kod tarafı bende; aşağıdakiler senin elini gerektiriyor (giriş, ödeme, sosyal hesap). $0 bütçeyi koruyoruz — mobile dev hesapları (~$124) ilk gelirden sonra.

## 1. Cloudflare Pages deploy (~15 dk, $0)

1. https://dash.cloudflare.com/sign-up — ücretsiz hesap aç (yoksa)
2. **Pages → Create a project → Connect to Git → GitHub → ta5jg/nyrvexis**
3. Build config:
   - Framework preset: **None**
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @nyrvexis/companion-web build`
   - Build output directory: `apps/companion-web/dist`
   - Root directory: `/` (boş bırak)
   - Environment variables: `NODE_VERSION=20`, `VITE_GATEWAY_URL=https://api.nyrvexis.com` (gateway prod URL'in için sonra)
4. **Deploy** → ilk build ~3-5 dk
5. Custom domain bağla:
   - Pages → Settings → Custom domains → `app.nyrvexis.com` ekle
   - Cloudflare DNS otomatik CNAME atar (zaten Cloudflare'da olduğun için)

## 2. Gateway prod (Fly.io ücretsiz tier, ~20 dk, $0)

1. https://fly.io/app/sign-up — ücretsiz, kredi kartı doğrulama gerek (charge yok)
2. `brew install flyctl` veya https://fly.io/docs/hands-on/install-flyctl/
3. Repo'da:
   ```bash
   cd /Users/irfangedik/nyrvexis
   fly auth login
   fly launch --config fly.toml --no-deploy --copy-config --name nyrvexis-gateway
   fly secrets set \
     KR_CORS_ORIGIN="https://app.nyrvexis.com" \
     KR_PUBLIC_BASE_URL="https://app.nyrvexis.com" \
     KR_LEGAL_PRIVACY_URL="https://nyrvexis.com/privacy" \
     KR_LEGAL_TERMS_URL="https://nyrvexis.com/terms" \
     KR_LEGAL_SUPPORT_EMAIL="support@nyrvexis.com"
   fly deploy
   ```
4. `fly certs create api.nyrvexis.com -a nyrvexis-gateway`
5. Cloudflare DNS'inde `api.nyrvexis.com` → `nyrvexis-gateway.fly.dev` (CNAME)

## 3. USDTg konfigi — ✅ ALINDI

Adresler env'e işlendi (.env, .env.example, .env.fly.example):
- USDTg contract: `TEpGiLGNB7W9W26LbvtU9wdukrLgLZwFgr`
- Treasury wallet: `TDhqMjTnDAUxYraTVLLie9Qd8NDGY91idq`

Yapacağın tek şey: Fly.io deploy edince secrets ata:
```bash
fly secrets set \
  KR_USDTG_CONTRACT=TEpGiLGNB7W9W26LbvtU9wdukrLgLZwFgr \
  KR_USDTG_TREASURY=TDhqMjTnDAUxYraTVLLie9Qd8NDGY91idq \
  -a nyrvexis-gateway
```

**Opsiyonel** ama önerilir: TronGrid API key
- https://www.trongrid.io/dashboard → register → "Create Project" → API key kopyala
- Free tier: 100K req/day (yeterli)
- Bana paylaş, gateway'e isteğe bağlı header olarak ekleriz

## 4. Sosyal hesaplar (~30 dk, $0)

### X (Twitter)
1. https://twitter.com/signup → `@nyrvexisgame` veya `@nyrvexis_game` (uygunluğa bak)
2. Bio: "Tactical async battler, powered by USDTg on TRON. Solo founder building in public. 🛡️⚔️"
3. Profile pic: NYRVEXIS logo (asset üretmem gerek — söyle yapayım)
4. **İlk post taslağı** (kopyala-yapıştır):
```
Day 1.

I'm a solo dev. I have a token (USDTg) with 51 holders.
I have $0 marketing budget. And 3 months.

Goal: ship a tactical battler that pays winners in USDTg.

Repo's open. Building in public.
→ app.nyrvexis.com

(reply if you want me to include your TRON address in the genesis airdrop)
```

### TikTok
1. https://tiktok.com/signup → `@nyrvexisgame`
2. İlk video formatı: ekran kaydı + voice-over (60sn). Şablon:
   - Hook: "I have $0 and 3 months to build a Web3 game empire"
   - Beat: "Here's day 1 build" (Nyrvexis demo gameplay 30sn)
   - CTA: "Follow if you want to watch this fail or win"

### Discord (opsiyonel ama şiddetle önerilirim)
1. https://discord.com/new → "Nyrvexis" sunucu
2. Kanallar: `#announcements`, `#general`, `#feedback`, `#airdrop-claims`, `#turkish`
3. Davet linki bio'na ekle

## 5. Domain konfig kontrol (~5 dk)

Senin elinde olduğunu söylediğin domain'ler:
- `nyrvexis.com` — landing/marketing site (basit static page, sonra üzerine bina)
- `nirvexa.com` — yedek (alternative spelling); şu an aktif değilse 301 redirect → nyrvexis.com

DNS hedefleri:
- `app.nyrvexis.com` → Cloudflare Pages
- `api.nyrvexis.com` → Fly.io gateway
- `nyrvexis.com` (apex) → Cloudflare Pages (ya da static landing)

## 6. Apple/Google dev hesapları — ŞİMDİ DEĞİL

İlk $200 gelir gelene kadar bekle. O zaman:
- Apple Developer: $99/yıl (zorunlu, mobile için)
- Google Play: $25 one-time

## Bana paylaşman gereken bilgiler

İşaretleyebilir liste — paylaştıkça W2 başlatılır:

- [ ] USDTg TRC20 contract address
- [ ] Treasury wallet address (USDTg + TRX bulunduran)
- [ ] TronGrid API key (opsiyonel)
- [ ] Cloudflare Pages deploy URL (ya da hata mesajı)
- [ ] Fly.io app deploy URL (ya da hata)
- [ ] X handle (kayıt sonrası)
- [ ] TikTok handle (kayıt sonrası)
- [ ] Discord davet linki

Bu 8 maddeyi tamamlayınca W2'ye geçeriz: USDTg gerçek transaction test'i + ilk content drop + airdrop kuralları.
