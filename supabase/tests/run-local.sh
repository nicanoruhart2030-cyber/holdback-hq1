#!/usr/bin/env bash
# Spins up a throwaway local Postgres cluster, applies a Supabase shim, all
# migrations and the seed, then runs the RLS tests. Requires Postgres 15+
# binaries (initdb, pg_ctl, psql) on PATH. No Docker needed.
set -euo pipefail
export LC_ALL="${LC_ALL:-C}" LANG="${LANG:-C}"

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WORK="$(mktemp -d /tmp/hbq-rls.XXXXXX)"
PORT="${RLS_TEST_PORT:-54329}"
trap 'pg_ctl -D "$WORK/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$WORK"' EXIT

initdb -D "$WORK/data" -U postgres --auth=trust >/dev/null
pg_ctl -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" start >/dev/null || { cat "$WORK/log"; exit 1; }
for _ in $(seq 1 30); do pg_isready -h "$WORK" -p "$PORT" >/dev/null 2>&1 && break; sleep 0.2; done

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/supabase/tests/local-shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/tests/rls.test.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /'
echo "RLS tests passed."
