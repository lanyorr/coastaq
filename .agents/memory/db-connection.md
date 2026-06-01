---
name: DB connection split
description: Two different Postgres instances exist — executeSql tool vs Supabase. Critical for migrations and data verification.
---

## Rule
Never use `executeSql` tool to verify or write data that the API server will read.
Always use `psql "$SUPABASE_POOLER_URL"` for anything the running API needs to see.

**Why:** The Replit `executeSql` tool connects to a local Postgres instance (DATABASE_URL),
while the API server connects to Supabase via SUPABASE_POOLER_URL. They are different databases.
Writes to one are not visible in the other.

**How to apply:**
- SQL migrations → always `psql "$DB_URL" <<'SQL' ... SQL` where DB_URL=${SUPABASE_POOLER_URL:-${SUPABASE_DATABASE_URL:-$DATABASE_URL}}
- Verifying rows the API will serve → use psql, not executeSql
- executeSql is only safe for truly local dev experiments not touching the API's data
- The DB_URL env var resolves: SUPABASE_POOLER_URL (primary) → SUPABASE_DATABASE_URL → DATABASE_URL
