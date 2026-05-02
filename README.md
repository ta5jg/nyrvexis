## NYRVEXIS

Fast-growing, session-based **async auto-battler + collection meta**.

This repo is a monorepo:
- `services/gateway`: TypeScript gateway (game API, progression, shop)
- `packages/protocol`: SSOT schemas + codegen-friendly types
- `packages/sdk-ts`: TypeScript SDK used by web/mobile companion apps
- `apps/companion-web`: web-first companion client (shareable battle replays)
- `apps/companion-mobile`: Capacitor shells (**iOS + Android**) wrapping `companion-web` (`pnpm run mobile:sync`)
- `apps/game-unity`: **Unity replay bridge** — drop-in `UnityPackage/` + golden JSON (`pnpm run unity:golden-export`); kurulum: [`apps/game-unity/UNITY_SETUP.md`](apps/game-unity/UNITY_SETUP.md)

Release roadmap (**SSOT**): [`docs/NYRVEXIS_RELEASE_ROADMAP.md`](docs/NYRVEXIS_RELEASE_ROADMAP.md).

### Mobile (Capacitor — R1)

From repo root after `pnpm i`:

```bash
pnpm run mobile:sync
```

Requires native projects added once — see [`apps/companion-mobile/README.md`](apps/companion-mobile/README.md). Then:

```bash
pnpm --filter @nyrvexis/companion-mobile exec cap open ios
pnpm --filter @nyrvexis/companion-mobile exec cap open android
```

CI runs **companion-web build + gateway typecheck/test + Playwright smoke + analytics Postgres** on `main` and PRs (`.github/workflows/nyrvexis-ci.yml`). TestFlight / Play Internal uploads are done locally after sync.

### Tests

```bash
pnpm test            # gateway vitest suite (sim, RNG, leaderboard guard, Stripe webhook)
pnpm test:e2e:smoke  # Playwright browser smoke against built gateway + companion-web
```

### Quick start (play on localhost)

1) Install deps

```bash
corepack enable
pnpm i
```

2) One command — installs if needed, builds protocol/SDK on first run, starts API + UI:

```bash
pnpm run play:local
```

Equivalent manual steps:

```bash
pnpm --filter @nyrvexis/protocol build && pnpm --filter @nyrvexis/sdk-ts build
pnpm run dev:full
```

Or two terminals: `pnpm dev` (gateway) then `pnpm run dev:companion` (web).

3) Optional env files

- **Repo root** `.env` — gateway reads this automatically in non-production (`KR_DATABASE_URL`, `KR_AUTH_SECRET`, etc.). Copy from [`.env.example`](.env.example).
- **Web** — optional [`apps/companion-web/.env.example`](apps/companion-web/.env.example) → `.env.local` for `VITE_GATEWAY_URL` (defaults already target `127.0.0.1:8787` when you open `localhost:5173`).

4) Open

- **Game UI:** [http://localhost:5173](http://localhost:5173) — use **Enter battle** → **Run battle** (needs gateway up).
- **Gateway health:** [http://127.0.0.1:8787/health](http://127.0.0.1:8787/health)

5) Postgres + analytics (optional, closer to prod)

```bash
docker compose -f deploy/docker-compose.yml up -d db
cp .env.example .env   # if you do not have .env yet
# Set KR_DATABASE_URL=postgres://nyrvexis:nyrvexis@127.0.0.1:5432/nyrvexis in .env
pnpm --filter @nyrvexis/gateway db:migrate
pnpm run play:local
```

### “DOWN / gateway offline”

The UI talks to the **gateway on port 8787**. Run **`pnpm run play:local`**, **`pnpm run dev:full`**, or **`pnpm dev`** plus **`pnpm run dev:companion`** from repo root.

If you use **`http://localhost:5173`**, the client calls **`http://127.0.0.1:8787`** on purpose (IPv4 loopback) so it still works when `localhost` would otherwise hit IPv6-only listeners.

From another device on your LAN, open **`http://<your-LAN-IP>:5173`** (Vite uses **`host: true`**); the client then uses **`http://<same-LAN-IP>:8787`**. Keep the gateway bound to **`0.0.0.0`** (default **`KR_HOST`**).

Optional: **`VITE_GATEWAY_URL`** in `apps/companion-web/.env.local` overrides the API base.
