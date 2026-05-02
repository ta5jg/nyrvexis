# Deploy stack (R8 / Phase 13)

Minimal **Postgres + gateway** stack for staging or single-node production. Companion-web ships separately as static files (`apps/companion-web/dist`) with `VITE_GATEWAY_URL` pointing at this API.

## Quick start

From repo root:

```bash
docker compose -f deploy/docker-compose.yml up --build
```

- Postgres: `localhost:5432` (user/db/password `nyrvexis` — **change before prod**).
- Gateway: `http://localhost:8787` (`GET /health`, `GET /metrics`).
- Migrations: `deploy/docker-entrypoint-gateway.sh` runs `services/gateway/migrations/*.sql` via `psql` when `KR_DATABASE_URL` is set.

Local migrations without Docker:

```bash
export KR_DATABASE_URL=postgres://nyrvexis:nyrvexis@localhost:5432/nyrvexis
pnpm --filter @nyrvexis/gateway db:migrate
```

## Production checklist

| Item | Notes |
|------|--------|
| Secrets | Set **`KR_AUTH_SECRET`** (and DB credentials) via your secret manager; never commit real values. |
| CORS | Set **`KR_CORS_ORIGIN`** to your web origin (single string, e.g. `https://app.example.com`); avoid `"*"` in production unless intentional. |
| TLS | Terminate TLS at reverse proxy / load balancer in front of the gateway. |
| Persistence | Keep Postgres on durable volumes / managed RDS equivalent. |
| Backups | `deploy/scripts/backup-postgres.sh` — see `docs/R8_LAUNCH_CHECKLIST.md`. |

## Monitoring

- **Liveness / readiness:** `GET /health` — includes `checks.database` when Postgres is configured.
- **Prometheus:** scrape `GET /metrics` (text exposition format).
- **Logs:** structured Fastify logs; correlate with `x-kr-trace-id` where emitted.

Example Prometheus scrape config:

```yaml
scrape_configs:
  - job_name: nyrvexis-gateway
    metrics_path: /metrics
    static_configs:
      - targets: ["gateway.internal:8787"]
```

## Compose validation (CI)

```bash
docker compose -f deploy/docker-compose.yml config
```
