#!/usr/bin/env bash
# Usage: KR_DATABASE_URL=postgres://... ./deploy/scripts/backup-postgres.sh [outfile.sql.gz]
set -euo pipefail
url="${KR_DATABASE_URL:?set KR_DATABASE_URL}"
out="${1:-kindrail-backup-$(date -u +%Y%m%dT%H%M%SZ).sql.gz}"
pg_dump "$url" --no-owner --no-acl | gzip -9 >"$out"
echo "wrote $out"
