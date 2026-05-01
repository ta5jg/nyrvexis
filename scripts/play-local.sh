#!/usr/bin/env bash
# Local playtest: install deps, ensure protocol/sdk builds, run gateway + companion-web.
# Usage: from repo root — bash scripts/play-local.sh   OR   pnpm run play:local
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "$ROOT/.env" ]] && [[ -f "$ROOT/.env.example" ]]; then
  echo "[play:local] Tip: cp .env.example .env if you need Postgres (KR_DATABASE_URL), IAP, or legal URLs."
fi

command -v pnpm >/dev/null 2>&1 || {
  echo "[play:local] Install pnpm: corepack enable && corepack prepare pnpm@9.15.0 --activate" >&2
  exit 1
}

pnpm install

if [[ ! -f packages/protocol/dist/index.js ]]; then
  echo "[play:local] Building @kindrail/protocol (first run)"
  pnpm --filter @kindrail/protocol build
fi
if [[ ! -f packages/sdk-ts/dist/index.js ]]; then
  echo "[play:local] Building @kindrail/sdk-ts (first run)"
  pnpm --filter @kindrail/sdk-ts build
fi

echo "[play:local] Starting gateway :8787 + web :5173 — open http://localhost:5173"
exec pnpm run dev:full
