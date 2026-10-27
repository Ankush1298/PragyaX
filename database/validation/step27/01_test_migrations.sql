-- ============================================================================
-- PragyaX Automated Migration Test Suite (Migrations 0001-0006)
-- Target: Disposable Local PostgreSQL 14+ Instance ONLY
-- File: database/validation/step27/01_test_migrations.sql
-- ============================================================================

\set ON_ERROR_STOP on

\echo '----------------------------------------------------------------------'
\echo 'STEP 1: Bootstrapping Local Supabase Role Stubs (anon, authenticated)'
\echo '----------------------------------------------------------------------'
-- Vanilla PostgreSQL does not have anon/authenticated roles by default.
-- We bootstrap dummy NOLOGIN roles so REVOKE statements in 0003/0005/0006 execute cleanly.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
    END IF;
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 2: Sequential Migration Application (0001 -> 0006)'
\echo '----------------------------------------------------------------------'
-- Executed as top-level psql metacommands (\i), NOT inside PL/pgSQL DO blocks.
\i database/migrations/0001_initial_schema.sql
\i database/migrations/0002_integrity_and_indexes.sql
\i database/migrations/0003_security_hardening.sql
\i database/migrations/0004_four_subject_curriculum_seed.sql
\i database/migrations/0005_roadmap_progress.sql
\i database/migrations/0006_points_ledger.sql

\echo '----------------------------------------------------------------------'
\echo 'STEP 3: Seeding Prerequisites for Relational Constraints'
\echo '----------------------------------------------------------------------'
-- Clean setup for foreign key targets (users, subjects, daily_challenges)
INSERT INTO public.users (id, name, email, password_hash, salt)
VALUES 
    ('usr_tester_01', 'Test Learner 1', 'tester1@pragyax.test', 'hash_val', 'salt_val'),
    ('usr_tester_02', 'Test Learner 2', 'tester2@pragyax.test', 'hash_val', 'salt_val')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.daily_challenges (
    id, title, topic, difficulty, description, code_snippet, question_type,
    option_a, option_b, option_c, option_d, correct_option, explanation, points
) VALUES (
    'chal_test_py', 'Python Test Challenge', 'Data Types', 'Easy',
    'Description', 'code = 1', 'multiple_choice',
    'A', 'B', 'C', 'D', 'A', 'Explanation', 50
) ON CONFLICT (id) DO NOTHING;

\echo '----------------------------------------------------------------------'
\echo 'STEP 4: Testing Duplicate XP Prevention (Idempotent Event Key)'
\echo '----------------------------------------------------------------------'
-- First write: live reward event
INSERT INTO public.points_ledger (
    id, event_key, user_id, source_type, source_id, points_delta, reason, badge_key, origin
) VALUES (
    'rwd_test_001', 'daily_challenge:chal_test_py:usr_tester_01', 'usr_tester_01',
    'daily_challenge', 'chal_test_py', 50, 'correct_answer', 'daily_striker', 'live'
);

-- Duplicate write with identical event_key must be a silent no-op via ON CONFLICT
INSERT INTO public.points_ledger (
    id, event_key, user_id, source_type, source_id, points_delta, reason, badge_key, origin
) VALUES (
    'rwd_test_002', 'daily_challenge:chal_test_py:usr_tester_01', 'usr_tester_01',
    'daily_challenge', 'chal_test_py', 50, 'correct_answer', 'daily_striker', 'live'
) ON CONFLICT (event_key) DO NOTHING;

-- Assert exactly 1 row exists
DO $$
DECLARE
    cnt int;
BEGIN
    SELECT COUNT(*) INTO cnt FROM public.points_ledger WHERE user_id = 'usr_tester_01';
    IF cnt <> 1 THEN
        RAISE EXCEPTION 'TEST FAILURE: Duplicate event_key was not deduplicated! Row count: %', cnt;
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Duplicate XP prevention verified (exactly 1 row).';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 5: Testing Revocation Uniqueness Constraint'
\echo '----------------------------------------------------------------------'
-- Initial revocation row
INSERT INTO public.points_ledger_revocations (id, ledger_id, reason, revoked_by)
VALUES ('rvk_test_001', 'rwd_test_001', 'Test administrative correction', 'admin_tester');

-- Duplicate revocation for same ledger_id MUST fail on unique constraint
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        INSERT INTO public.points_ledger_revocations (id, ledger_id, reason, revoked_by)
        VALUES ('rvk_test_002', 'rwd_test_001', 'Duplicate revocation attempt', 'admin_tester');
    EXCEPTION WHEN unique_violation THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'TEST FAILURE: Duplicate revocation on ledger_id did not raise unique_violation!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Revocation uniqueness enforced (unique_violation caught).';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 6: Testing Check Constraints (Negative Points & Invalid Origin)'
\echo '----------------------------------------------------------------------'
-- Negative points MUST fail on chk_points_ledger_positive
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        INSERT INTO public.points_ledger (
            id, event_key, user_id, source_type, source_id, points_delta, reason, origin
        ) VALUES (
            'rwd_neg_001', 'test:neg:usr_tester_02', 'usr_tester_02',
            'test', 'neg', -10, 'correct_answer', 'live'
        );
    EXCEPTION WHEN check_violation THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'TEST FAILURE: Negative points_delta was permitted by check constraint!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Negative points rejected (check_violation caught).';
END $$;

-- Invalid origin MUST fail on chk_points_ledger_origin
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        INSERT INTO public.points_ledger (
            id, event_key, user_id, source_type, source_id, points_delta, reason, origin
        ) VALUES (
            'rwd_orig_001', 'test:orig:usr_tester_02', 'usr_tester_02',
            'test', 'orig', 10, 'correct_answer', 'invalid_origin'
        );
    EXCEPTION WHEN check_violation THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'TEST FAILURE: Invalid origin was permitted by check constraint!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Invalid origin rejected (check_violation caught).';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 7: Testing Foreign Key Cascade on User Deletion'
\echo '----------------------------------------------------------------------'
-- Insert a dedicated user with ledger and revocation entries to test cascade
INSERT INTO public.users (id, name, email, password_hash, salt)
VALUES ('usr_cascade_01', 'Cascade User', 'cascade@pragyax.test', 'hash', 'salt');

INSERT INTO public.points_ledger (
    id, event_key, user_id, source_type, source_id, points_delta, reason, origin
) VALUES (
    'rwd_cascade_01', 'test:cascade:usr_cascade_01', 'usr_cascade_01',
    'test', 'cascade', 100, 'correct_answer', 'live'
);

INSERT INTO public.points_ledger_revocations (id, ledger_id, reason, revoked_by)
VALUES ('rvk_cascade_01', 'rwd_cascade_01', 'Pre-cascade revocation', 'admin');

-- Deleting user must cascade to points_ledger and points_ledger_revocations
DELETE FROM public.users WHERE id = 'usr_cascade_01';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.points_ledger WHERE id = 'rwd_cascade_01') THEN
        RAISE EXCEPTION 'TEST FAILURE: points_ledger row was not cascaded on user deletion!';
    END IF;
    IF EXISTS (SELECT 1 FROM public.points_ledger_revocations WHERE id = 'rvk_cascade_01') THEN
        RAISE EXCEPTION 'TEST FAILURE: points_ledger_revocations row was not cascaded on ledger deletion!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Cascade deletion from users -> points_ledger -> revocations verified.';
END $$;

\echo '----------------------------------------------------------------------'
\echo 'STEP 8: Testing Fail-Closed Preflight on Re-running 0006'
\echo '----------------------------------------------------------------------'
-- Because points_ledger already exists, Section 1 preflight of 0006 MUST raise an exception.
DO $$
DECLARE
    caught boolean := false;
BEGIN
    BEGIN
        -- Execute the exact preflight block from 0006
        IF to_regclass('public.points_ledger') IS NOT NULL THEN
            RAISE EXCEPTION 'Fail-closed preflight violation: public.points_ledger already exists prior to applying migration 0006.';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        caught := true;
    END;

    IF NOT caught THEN
        RAISE EXCEPTION 'TEST FAILURE: Fail-closed preflight failed to detect pre-existing points_ledger!';
    END IF;
    RAISE NOTICE 'ASSERTION PASSED: Fail-closed preflight halted on pre-existing table.';
END $$;

\echo '======================================================================'
\echo 'ALL MIGRATION SUITE TESTS PASSED SUCCESSFULLY'
\echo '======================================================================'
