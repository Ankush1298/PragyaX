-- ============================================================================
-- PragyaX PostgreSQL Database Migration
-- Version: 0006
-- Description: Points ledger and revocations schema for gamification.
-- Author: Nagin (Senior Database Architect & Supabase Specialist)
-- Target: PostgreSQL 14+ / Supabase PostgreSQL
-- 
-- ARCHITECTURAL RATIONALE:
-- 1. OPERATIONAL APPEND-ONLY DESIGN: Designed as an append-only ledger for normal
--    application operations. Points are strictly non-negative (points_delta >= 0).
--    Corrections are handled via the points_ledger_revocations table rather than
--    in-place row updates or negative point values. Note: Because foreign keys use
--    ON DELETE CASCADE to maintain consistency with users(id), records will be purged
--    if the parent user account is deleted, pending final retention decision (D-5).
-- 2. DETERMINISTIC IDEMPOTENCY: Enforces UNIQUE(event_key) matching the canonical
--    domain format <source_type>:<source_id>:<user_id> (e.g. 'daily_challenge:chal_today_py:usr_123').
-- 3. QUERY OPTIMIZATION: Indexing on (user_id, points_delta) and (created_at DESC, user_id)
--    enables index-only scans for dashboard XP totals and fast time-windowed leaderboard queries.
-- 4. SECURITY & ISOLATION: Public PostgREST API access (anon, authenticated) is
--    completely revoked and Row-Level Security (RLS Default-Deny) is enforced.
-- 5. LEAST-PRIVILEGE ACCESS: Designed for a dedicated FastAPI backend service role
--    granted strictly SELECT and INSERT permissions, avoiding superuser or BYPASSRLS.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Fail-Closed Prerequisite Catalog Check
-- ----------------------------------------------------------------------------
-- Preflight raises an explicit exception if dependencies are missing, or if either
-- target table pre-exists in the catalog prior to applying this migration.
-- Defends against silent acceptance of divergent, partial, or out-of-band tables.
-- Never drops or overwrites pre-existing tables.
DO $$
BEGIN
    -- Prerequisite 1: Core dependency from 0001_initial_schema.sql must exist
    IF to_regclass('public.users') IS NULL THEN
        RAISE EXCEPTION 'Prerequisite violation: public.users does not exist. Please apply 0001_initial_schema.sql first.';
    END IF;

    -- Prerequisite 2: Fail-closed check — points_ledger must NOT pre-exist prior to applying 0006.
    IF to_regclass('public.points_ledger') IS NOT NULL THEN
        RAISE EXCEPTION 'Fail-closed preflight violation: public.points_ledger already exists prior to applying migration 0006. Halting migration to prevent accidental schema divergence or data corruption. Manual review required.';
    END IF;

    -- Prerequisite 3: Fail-closed check — points_ledger_revocations must NOT pre-exist prior to applying 0006.
    IF to_regclass('public.points_ledger_revocations') IS NOT NULL THEN
        RAISE EXCEPTION 'Fail-closed preflight violation: public.points_ledger_revocations already exists prior to applying migration 0006. Halting migration to prevent accidental schema divergence or data corruption. Manual review required.';
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Table: points_ledger (Reward Journal)
-- ----------------------------------------------------------------------------
-- Uses strict CREATE TABLE (fail-closed preflight ensures clean target space).
CREATE TABLE points_ledger (
    id            VARCHAR(64) PRIMARY KEY,
    event_key     VARCHAR(255) NOT NULL,
    user_id       VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type   VARCHAR(32) NOT NULL,
    source_id     VARCHAR(64) NOT NULL,
    points_delta  INTEGER NOT NULL,
    reason        VARCHAR(32) NOT NULL,
    badge_key     VARCHAR(64) NULL,
    origin        VARCHAR(16) NOT NULL DEFAULT 'live',
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_points_ledger_event_key UNIQUE (event_key),
    CONSTRAINT chk_points_ledger_positive CHECK (points_delta >= 0),
    CONSTRAINT chk_points_ledger_origin CHECK (origin IN ('live', 'backfill_v1'))
);

-- ----------------------------------------------------------------------------
-- 3. Table: points_ledger_revocations (Operational Corrections)
-- ----------------------------------------------------------------------------
-- Implements Decision D-1 (Option A): Erroneous or abusive rewards are revoked
-- by recording an explicit revocation entry rather than mutating the ledger row.
-- Uses strict CREATE TABLE.
CREATE TABLE points_ledger_revocations (
    id          VARCHAR(64) PRIMARY KEY,
    ledger_id   VARCHAR(64) NOT NULL REFERENCES points_ledger(id) ON DELETE CASCADE,
    reason      VARCHAR(255) NOT NULL,
    revoked_by  VARCHAR(64) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_points_ledger_revocation UNIQUE (ledger_id)
);

-- ----------------------------------------------------------------------------
-- 4. Query-Driven Performance Indexes
-- ----------------------------------------------------------------------------

-- Fast user point balance calculation:
-- Used by: repository.py get_user_dashboard_metrics
-- Query: SELECT COALESCE(SUM(points_delta), 0) FROM points_ledger WHERE user_id = ?
CREATE INDEX idx_points_ledger_user_points 
    ON points_ledger (user_id, points_delta);

-- Fast periodic and platform leaderboard aggregation:
-- Used by: services/leaderboard_engine.py
-- Query: Aggregate XP totals over rolling time windows (e.g. 7 days, 30 days)
CREATE INDEX idx_points_ledger_created_user 
    ON points_ledger (created_at DESC, user_id, points_delta);

-- Source entity verification and audit index:
CREATE INDEX idx_points_ledger_source 
    ON points_ledger (source_type, source_id);

-- NOTE: No index created on points_ledger_revocations(ledger_id) because
-- CONSTRAINT uq_points_ledger_revocation UNIQUE (ledger_id) automatically
-- generates a unique B-tree index on that column.

-- ----------------------------------------------------------------------------
-- 5. PostgREST Lockdown (Revoke Public Grants)
-- ----------------------------------------------------------------------------
-- PragyaX routes gamification transactions through FastAPI (/api/challenges/*).
-- Direct HTTP access via Supabase anon / authenticated roles must be blocked.
REVOKE ALL ON TABLE points_ledger FROM anon, authenticated;
REVOKE ALL ON TABLE points_ledger_revocations FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 6. Defense-In-Depth Row-Level Security (RLS Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger_revocations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. Backend Service Least-Privilege Access Architecture & Findings
-- ----------------------------------------------------------------------------
-- FINDINGS ON BACKEND ACCESS & RLS:
-- 1. NO auth.uid() DEPENDENCY: PragyaX uses internal session bearer tokens
--    (usr_<hex12>), not Supabase Auth JWTs. auth.uid() is not applicable.
-- 2. BACKEND ROLE IDENTIFIER UNKNOWN: The backend connects via DATABASE_URL,
--    which varies by deployment environment. No dedicated non-superuser role
--    (e.g., pragyax_backend_app) has been provisioned in 0001-0005.
-- 3. RLS DEFAULT-DENY IMPACT: Under Default-Deny RLS, any database user that is
--    neither the table owner nor possesses BYPASSRLS will be blocked from SELECT
--    and INSERT queries unless a permissive RLS policy is attached.
-- 4. ARCHITECTURAL RECOMMENDATION: When the dedicated service role is agreed upon,
--    grant strictly SELECT and INSERT (NO UPDATE or DELETE):
--      GRANT SELECT, INSERT ON TABLE points_ledger TO <backend_role>;
--      GRANT SELECT, INSERT ON TABLE points_ledger_revocations TO <backend_role>;
--    And attach an approved service RLS policy:
--      CREATE POLICY backend_service_points_ledger ON points_ledger
--          FOR ALL TO <backend_role> USING (true) WITH CHECK (true);
--      CREATE POLICY backend_service_points_ledger_revocations ON points_ledger_revocations
--          FOR ALL TO <backend_role> USING (true) WITH CHECK (true);
-- 5. MULTI-TENANT ISOLATION: Authorization (user_id == current_user.id) is
--    enforced at the FastAPI router/service layer.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- 8. Operational & Integration Contracts for Backend Repository
-- ----------------------------------------------------------------------------
-- 1. CONFLICTING DUPLICATE PAYLOADS:
--    The event_key (<source_type>:<source_id>:<user_id>) is canonical and enforced
--    by CONSTRAINT uq_points_ledger_event_key UNIQUE (event_key).
--    Points are resolved strictly from server-side config (daily_challenges.points),
--    never from client payloads. In the repository write statement, executing
--    INSERT ... ON CONFLICT (event_key) DO NOTHING guarantees that retries with
--    altered payloads cannot mutate or duplicate existing awards.
-- 2. ATOMIC TRANSACTION BOUNDARIES:
--    Challenge submission (user_challenge_submissions), points credit
--    (points_ledger), and badge award (user_badges) MUST execute inside a single
--    database transaction block. In SQLite, start with BEGIN IMMEDIATE to serialize
--    writes; in PostgreSQL, use standard transaction isolation.
-- 3. REVOKED XP EXCLUSION FROM TOTALS:
--    To calculate active XP totals excluding revoked awards, the backend repository
--    must query using a LEFT JOIN / ANTI-JOIN:
--      SELECT COALESCE(SUM(l.points_delta), 0) AS total_xp
--      FROM points_ledger l
--      LEFT JOIN points_ledger_revocations r ON l.id = r.ledger_id
--      WHERE l.user_id = :user_id AND r.id IS NULL;
-- ----------------------------------------------------------------------------

COMMIT;
