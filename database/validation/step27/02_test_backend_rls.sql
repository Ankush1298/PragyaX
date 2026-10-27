-- ============================================================================
-- PragyaX Automated Backend RLS & Role Isolation Test Suite
-- Target: Disposable Local PostgreSQL 14+ Instance ONLY
-- File: database/validation/step27/02_test_backend_rls.sql
-- ============================================================================

\set ON_ERROR_STOP on

\echo '----------------------------------------------------------------------'
\echo 'STEP 1: Provisioning Isolated Test Backend Role (Non-Superuser, No BYPASSRLS)'
\echo '----------------------------------------------------------------------'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'test_pragyax_app') THEN
        CREATE ROLE test_pragyax_app WITH LOGIN PASSWORD 'test_secure_password';
    END IF;
END $$;

-- Verify the test role is unprivileged
DO $$
DECLARE
    rec record;
BEGIN
    SELECT rolsuper, rolbypassrls INTO rec FROM pg_roles WHERE rolname = 'test_pragyax_app';
    IF rec.rolsuper OR rec.rolbypassrls THEN
        RAISE EXCEPTION 'TEST SETUP ERROR: test_pragyax_app must not have SUPERUSER or BYPASSRLS!';
    END IF;
    RAISE NOTICE 'CONFIRMED: test_pragyax_app is a restricted role (super=%, bypassrls=%)', rec.rolsuper, rec.rolbypassrls;
END $$;

-- Grant database connection and schema usage
GRANT CONNECT ON DATABASE current_database() TO test_pragyax_app;
GRANT USAGE ON SCHEMA public TO test_pragyax_app;

\echo '----------------------------------------------------------------------'
\echo 'STEP 2: Granting Table Permissions to Test Backend Role'
\echo '----------------------------------------------------------------------'
-- 1. Standard application tables: Full CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
    public.users, 
    public.user_preferences, 
    public.subjects, 
    public.assessment_questions, 
    public.chat_messages, 
    public.assessment_attempts, 
    public.daily_challenges, 
    public.user_challenge_submissions, 
    public.user_badges, 
    public.active_sessions,
    public.user_roadmap_progress
TO test_pragyax_app;

-- 2. Points Ledger tables: Strictly Append-Only (SELECT, INSERT)
-- UPDATE and DELETE grants are explicitly NOT GRANTED
GRANT SELECT, INSERT ON TABLE 
    public.points_ledger, 
    public.points_ledger_revocations 
TO test_pragyax_app;

\echo '----------------------------------------------------------------------'
\echo 'STEP 3: Attaching Scoped Service RLS Policies for Test Backend Role'
\echo '----------------------------------------------------------------------'
-- Because 0003, 0005, and 0006 enabled RLS across all tables, any role lacking
-- BYPASSRLS will be blocked unless an explicit permissive policy is attached.
DO $$
DECLARE
    tbl text;
    policy_sql text;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        -- Drop policy if it already exists from a prior test run
        EXECUTE format('DROP POLICY IF EXISTS test_app_policy_%I ON public.%I;', tbl, tbl);
        -- Create explicit service policy for test_pragyax_app
        EXECUTE format('CREATE POLICY test_app_policy_%I ON public.%I FOR ALL TO test_pragyax_app USING (true) WITH CHECK (true);', tbl, tbl);
    END LOOP;
    RAISE NOTICE 'Attached scoped service RLS policies for test_pragyax_app across public tables.';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 4: Testing Authorized Backend SELECT & INSERT on points_ledger'
\echo '----------------------------------------------------------------------'
-- Seed base user as superuser/owner before switching
INSERT INTO public.users (id, name, email, password_hash, salt)
VALUES ('usr_rls_test_01', 'RLS Tester', 'rls@pragyax.test', 'hash', 'salt')
ON CONFLICT (id) DO NOTHING;

-- Switch session to the unprivileged test backend role
SET ROLE test_pragyax_app;

-- 1. Test SELECT on points_ledger (must succeed)
SELECT COUNT(*) FROM public.points_ledger WHERE user_id = 'usr_rls_test_01';

-- 2. Test INSERT on points_ledger (must succeed)
INSERT INTO public.points_ledger (
    id, event_key, user_id, source_type, source_id, points_delta, reason, origin
) VALUES (
    'rwd_rls_app_01', 'test:rls:usr_rls_test_01', 'usr_rls_test_01',
    'test', 'rls', 50, 'correct_answer', 'live'
);

-- 3. Test INSERT on points_ledger_revocations (must succeed)
INSERT INTO public.points_ledger_revocations (id, ledger_id, reason, revoked_by)
VALUES ('rvk_rls_app_01', 'rwd_rls_app_01', 'Test authorized revocation', 'test_pragyax_app');

\echo '----------------------------------------------------------------------'
\echo 'STEP 5: Testing Denied UPDATE & DELETE on points_ledger for Backend Role'
\echo '----------------------------------------------------------------------'
-- UPDATE on points_ledger MUST be denied by PostgreSQL permissions
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        UPDATE public.points_ledger SET points_delta = 999 WHERE id = 'rwd_rls_app_01';
    EXCEPTION WHEN insufficient_privilege THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'SECURITY FAILURE: UPDATE was permitted on points_ledger for test_pragyax_app!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: UPDATE on points_ledger denied (insufficient_privilege caught).';
END $$;

-- DELETE on points_ledger MUST be denied by PostgreSQL permissions
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        DELETE FROM public.points_ledger WHERE id = 'rwd_rls_app_01';
    EXCEPTION WHEN insufficient_privilege THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'SECURITY FAILURE: DELETE was permitted on points_ledger for test_pragyax_app!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: DELETE on points_ledger denied (insufficient_privilege caught).';
END $$;

-- UPDATE on points_ledger_revocations MUST be denied
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        UPDATE public.points_ledger_revocations SET reason = 'tampered' WHERE id = 'rvk_rls_app_01';
    EXCEPTION WHEN insufficient_privilege THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'SECURITY FAILURE: UPDATE was permitted on points_ledger_revocations!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: UPDATE on points_ledger_revocations denied.';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 6: Testing Total Rejection of Unauthorized Roles (anon)'
\echo '----------------------------------------------------------------------'
-- Switch session to the untrusted anon role
SET ROLE anon;

-- SELECT on points_ledger MUST fail
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        PERFORM * FROM public.points_ledger;
    EXCEPTION WHEN insufficient_privilege THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'SECURITY FAILURE: anon role was able to SELECT from points_ledger!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: anon role SELECT denied by Default-Deny RLS / grant revocation.';
END $$;

-- INSERT on points_ledger MUST fail
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        INSERT INTO public.points_ledger (
            id, event_key, user_id, source_type, source_id, points_delta, reason, origin
        ) VALUES (
            'rwd_anon_hack', 'test:anon:usr_rls_test_01', 'usr_rls_test_01',
            'test', 'hack', 1000, 'correct_answer', 'live'
        );
    EXCEPTION WHEN insufficient_privilege THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'SECURITY FAILURE: anon role was able to INSERT into points_ledger!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: anon role INSERT denied by Default-Deny RLS / grant revocation.';
END $$;

-- Cleanly restore session role
RESET ROLE;

\echo '======================================================================'
\echo 'ALL BACKEND RLS & LEAST-PRIVILEGE TESTS PASSED SUCCESSFULLY'
\echo '======================================================================'
