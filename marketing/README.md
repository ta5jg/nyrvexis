# Nyrvexis Marketing Site

Static landing page for `nyrvexis.com` (apex). Separate from the game web app
(`app.nyrvexis.com`) so the marketing voice and the product are deployed
independently.

## Stack
- Plain HTML + CSS, zero build step
- Tally.so embedded form for waitlist (replace `<YOUR_FORM_ID>` in `index.html`)
- Cloudflare Pages free tier

## Deploy (Cloudflare Pages — separate project from the game)

1. Cloudflare dashboard → Pages → **Create a project** → Direct Upload
   (or Connect to Git → ta5jg/nyrvexis with Build output dir = `marketing/`)
2. Set root: `marketing/`
3. No build command needed (static)
4. Custom domain: `nyrvexis.com` (apex) + `www.nyrvexis.com` (CNAME → apex)

## Tally form setup (~5 dk)

1. https://tally.so → free signup
2. New form: 1 field (TRON address) + email (optional)
3. Embed → copy form ID (e.g. `mEPK1d`)
4. Edit `index.html` line ~95: replace `<YOUR_FORM_ID>` with your ID

## Updating

Just edit and redeploy. No framework, no build cache, no `node_modules`.
Deliberately boring so the marketing surface stays maintainable as content evolves.
