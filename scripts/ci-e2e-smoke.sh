#!/usr/bin/env bash
# R6.1 — CI: gateway + vite preview + Playwright smoke (repo root).
# Local: run from repo root — builds protocol + sdk-ts + companion-web + gateway unless
# KR_E2E_SKIP_BUILD=1 (CI sets this after explicit build steps).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -z "${KR_E2E_SKIP_BUILD:-}" ]]; then
  pnpm --filter @kindrail/protocol build
  pnpm --filter @kindrail/sdk-ts build
  pnpm --filter @kindrail/companion-web build
  pnpm --filter @kindrail/gateway build
fi

cleanup() {
  [[ -n "${WEB_PID:-}" ]] && kill "${WEB_PID}" 2>/dev/null || true
  [[ -n "${GW_PID:-}" ]] && kill "${GW_PID}" 2>/dev/null || true
}
trap cleanup EXIT

pnpm --filter @kindrail/gateway start &
GW_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:8787/health" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -sf "http://127.0.0.1:8787/health" >/dev/null || {
  echo "::error::Gateway failed to become healthy on :8787"
  exit 1
}

pnpm --filter @kindrail/companion-web exec vite preview --host 127.0.0.1 --port 4173 &
WEB_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:4173/" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -sf "http://127.0.0.1:4173/" >/dev/null || {
  echo "::error::Vite preview failed on :4173"
  exit 1
}

cd apps/companion-web
pnpm exec playwright test
