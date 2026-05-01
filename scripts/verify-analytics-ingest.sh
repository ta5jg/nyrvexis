#!/usr/bin/env bash
# End-to-end: Postgres migrations → gateway with KR_DATABASE_URL → POST /analytics/event → row in DB.
# Requires: Docker (optional, for db), curl, pnpm, gateway built (script builds if needed).
# Usage from repo root:
#   ./scripts/verify-analytics-ingest.sh
# Or with existing Postgres:
#   KR_DATABASE_URL=postgres://user:pass@127.0.0.1:5432/kindrail ./scripts/verify-analytics-ingest.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

VERIFY_PORT="${KR_VERIFY_PORT:-9887}"
AUTH_SECRET="${KR_AUTH_SECRET:-dev-only-change-me-please-CHANGE}"
EVENT_NAME="verify.http.${VERIFY_PORT}.$$"

KR_DATABASE_URL_EFFECTIVE="${KR_DATABASE_URL:-}"

if [[ -z "$KR_DATABASE_URL_EFFECTIVE" ]]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Set KR_DATABASE_URL or install Docker to start deploy/docker-compose db." >&2
    exit 1
  fi
  docker compose -f deploy/docker-compose.yml up -d db
  for _ in $(seq 1 90); do
    if docker compose -f deploy/docker-compose.yml exec -T db pg_isready -U kindrail -d kindrail >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
  docker compose -f deploy/docker-compose.yml exec -T db pg_isready -U kindrail -d kindrail >/dev/null || {
    echo "::error::Postgres did not become ready" >&2
    exit 1
  }
  KR_DATABASE_URL_EFFECTIVE="postgres://kindrail:kindrail@127.0.0.1:5432/kindrail"
fi

export KR_DATABASE_URL="$KR_DATABASE_URL_EFFECTIVE"

pnpm --filter @kindrail/protocol build
pnpm --filter @kindrail/sdk-ts build
pnpm --filter @kindrail/gateway build

cleanup() {
  [[ -n "${GW_PID:-}" ]] && kill "${GW_PID}" 2>/dev/null || true
}
trap cleanup EXIT

(
  cd services/gateway
  exec env KR_HOST="127.0.0.1" KR_PORT="${VERIFY_PORT}" KR_DATABASE_URL="${KR_DATABASE_URL_EFFECTIVE}" \
    KR_AUTH_SECRET="${AUTH_SECRET}" node dist/index.js
) &
GW_PID=$!

for _ in $(seq 1 60); do
  if curl -sf "http://127.0.0.1:${VERIFY_PORT}/health" >/dev/null; then
    break
  fi
  sleep 0.5
done
curl -sf "http://127.0.0.1:${VERIFY_PORT}/health" >/dev/null || {
  echo "::error::Gateway did not become healthy on :${VERIFY_PORT}" >&2
  exit 1
}

BODY="$(printf '{"v":1,"name":"%s","props":{"via":"curl"}}' "${EVENT_NAME}")"
RESP="$(curl -sS -w "\n%{http_code}" -X POST "http://127.0.0.1:${VERIFY_PORT}/analytics/event" \
  -H "content-type: application/json" \
  -d "${BODY}")"
HTTP="$(echo "${RESP}" | tail -n 1)"
JSON="$(echo "${RESP}" | sed '$d')"
if [[ "${HTTP}" != "200" ]]; then
  echo "unexpected HTTP ${HTTP} body: ${JSON}" >&2
  exit 1
fi
echo "${JSON}" | grep -q '"ok":true' || {
  echo "unexpected JSON: ${JSON}" >&2
  exit 1
}

COUNT=""
if command -v docker >/dev/null 2>&1 && docker compose -f deploy/docker-compose.yml ps -q db 2>/dev/null | grep -q .; then
  COUNT="$(docker compose -f deploy/docker-compose.yml exec -T db psql -U kindrail -d kindrail -tAc \
    "SELECT count(*)::text FROM analytics_events WHERE name='${EVENT_NAME}'")"
else
  if command -v psql >/dev/null 2>&1; then
    COUNT="$(psql "${KR_DATABASE_URL_EFFECTIVE}" -tAc "SELECT count(*)::text FROM analytics_events WHERE name='${EVENT_NAME}'")"
  else
    echo "warn: no docker db nor psql — skipping SQL row check (HTTP ok)." >&2
    COUNT="skip"
  fi
fi

if [[ "${COUNT}" == "skip" ]]; then
  echo "verify-analytics-ingest ok (HTTP only)."
  exit 0
fi
COUNT_TRIM="$(echo "${COUNT}" | tr -d '[:space:]')"
if [[ "${COUNT_TRIM}" != "1" ]]; then
  echo "expected 1 analytics_events row for ${EVENT_NAME}, got: '${COUNT_TRIM}'" >&2
  exit 1
fi

echo "verify-analytics-ingest ok (HTTP + DB row)."
