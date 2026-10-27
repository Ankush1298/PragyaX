# PragyaX Supabase PostgreSQL Integration Guide
**Teammate Ownership:** Nagin (Supabase Database Architecture)

## Overview
PragyaX is designed with a **Repository Pattern** abstraction:
- In local demo mode: PragyaX uses a zero-config SQLite persistence layer (`pragyax.db`), which requires no external services and survives server restarts.
- In production/cloud mode: Nagin can connect PragyaX directly to a hosted Supabase PostgreSQL instance.

---

## 1. Setting up Supabase
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Paste and execute the contents of `database/schema.sql`.
4. Paste and execute the contents of `database/seed.sql`.

---

## 2. Environment Configuration
Add the Supabase credentials to `.env`:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

---

## 3. Recommended Row-Level Security (RLS) Policies
When transitioning to Supabase Auth:
```sql
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only read their own attempts"
ON assessment_attempts FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can only insert their own attempts"
ON assessment_attempts FOR INSERT
WITH CHECK (auth.uid()::text = user_id);
```

---

## 4. Teammate Extension Point
In `backend/app/database/connection.py` and `backend/app/database/repository.py`, the repository interface decouples the SQL engine. Nagin can swap the SQLite execution cursor with `asyncpg` or the `supabase-py` client without changing any FastAPI router logic!
