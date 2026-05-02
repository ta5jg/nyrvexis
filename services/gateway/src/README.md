## @nyrvexis/gateway

Local dev:

```bash
pnpm dev --filter @nyrvexis/gateway
```

Production build (`pnpm --filter @nyrvexis/gateway build`) runs `tsc` then copies `src/content/catalogs/*.json` into `dist/content/catalogs/` (`scripts/copy-catalogs.mjs`) so `node dist/index.js` resolves catalog paths.

Health:
- `GET /health`

