## KINDRAIL

Fast-growing, session-based **async auto-battler + collection meta**.

This repo is a monorepo:
- `services/gateway`: TypeScript gateway (game API, progression, shop)
- `packages/protocol`: SSOT schemas + codegen-friendly types
- `packages/sdk-ts`: TypeScript SDK used by web/mobile companion apps
- `apps/companion-web`: web-first companion client (shareable battle replays)
- `apps/companion-mobile`: Capacitor shells (**iOS + Android**) wrapping `companion-web` (`pnpm run mobile:sync`)
- `apps/game-unity`: (future) Unity client (WebGL/iOS/Android)

Release roadmap (**SSOT**): [`docs/KINDRAIL_RELEASE_ROADMAP.md`](docs/KINDRAIL_RELEASE_ROADMAP.md).

### Mobile (Capacitor — R1)

From repo root after `pnpm i`:

```bash
pnpm run mobile:sync
```

Requires native projects added once — see [`apps/companion-mobile/README.md`](apps/companion-mobile/README.md). Then:

```bash
pnpm --filter @kindrail/companion-mobile exec cap open ios
pnpm --filter @kindrail/companion-mobile exec cap open android
```

CI runs **companion-web build + gateway typecheck** on `main` and PRs (`.github/workflows/kindrail-ci.yml`). TestFlight / Play Internal uploads are done locally after sync.

### Quick start

1) Install deps

```bash
corepack enable
pnpm i
```

2) Run gateway **and** web together

```bash
pnpm run dev:full
```

Or two terminals: `pnpm dev` then `pnpm run dev:companion`.

3) Run web only (if gateway already running elsewhere)

```bash
pnpm run dev:companion
```

4) Open
- Web: `http://localhost:5173`
- Gateway health: `GET http://localhost:8787/health`

### “DOWN / gateway offline”

The UI talks to the **gateway on port 8787**. Run **`pnpm run dev:full`** from repo root, or **`pnpm dev`** plus **`pnpm run dev:companion`**.

If you use **`http://localhost:5173`**, the client calls **`http://127.0.0.1:8787`** on purpose (IPv4 loopback) so it still works when `localhost` would otherwise hit IPv6-only listeners.

From another device on your LAN, open **`http://<your-LAN-IP>:5173`** (Vite uses **`host: true`**); the client then uses **`http://<same-LAN-IP>:8787`**. Keep the gateway bound to **`0.0.0.0`** (default **`KR_HOST`**).

Optional: **`VITE_GATEWAY_URL`** in `apps/companion-web/.env.local` overrides the API base.
