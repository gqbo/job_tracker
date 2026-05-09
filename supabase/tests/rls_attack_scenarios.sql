-- RLS Attack Scenarios — Slice 1 verification
-- Tests REQ-RLS-001 (cross-user note injection), REQ-RLS-002 (DEFAULT auth.uid()),
-- and REQ-RLS-003 (SELECT/UPDATE/DELETE isolation remain intact).
--
-- HOW TO RUN
-- ----------
-- Prerequisites:
--   1. Local Supabase running: `supabase start`
--   2. Two test users already created via Supabase Auth (e.g. via the web app or
--      `supabase auth admin create` / the Supabase dashboard).
--      Note their UUIDs as USER_A_ID and USER_B_ID.
--   3. Each user must have at least one application row in the `applications` table.
--      Note User A's application UUID as APP_A_ID and User B's as APP_B_ID.
--   4. Obtain a JWT for User A (e.g. via browser DevTools → Network tab → any
--      Supabase request → Authorization header). Set it in psql with:
--        SET request.jwt.claim.sub = '<USER_A_ID>';
--        SET request.jwt.claim.role = 'authenticated';
--        SET role = 'authenticated';
--      OR use a Supabase helper:
--        SELECT set_config('request.jwt.claims',
--          '{"sub":"<USER_A_ID>","role":"authenticated"}', true);
--
-- Run against the local DB:
--   psql "$(supabase status | grep 'DB URL' | awk '{print $NF}')" \
--     -f supabase/tests/rls_attack_scenarios.sql
--
-- Expected outcome: every assertion block prints its label with PASS or surfaces
-- the expected error. Any unexpected SUCCESS is a failing test.
--
-- NOTE: Replace the placeholder UUIDs below before running.
--   USER_A_ID  — the authenticated attacker (all INSERT attempts run as this user)
--   USER_B_ID  — the victim (owns APP_B_ID and NOTE_B_ID)
--   APP_A_ID   — an application owned by User A (valid INSERT target)
--   APP_B_ID   — an application owned by User B (invalid INSERT target for User A)
--   NOTE_B_ID  — a note owned by User B (used for UPDATE/DELETE isolation tests)

-- ============================================================
-- SETUP: impersonate User A via RLS context
-- ============================================================
-- Replace <USER_A_ID> with User A's actual UUID.
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"<USER_A_ID>","role":"authenticated"}',
  true
);
SET LOCAL role = authenticated;


-- ============================================================
-- SCENARIO 1 — Cross-user note injection (REQ-RLS-001 scenario 2)
-- User A tries to insert a note into an application owned by User B.
-- Expected: INSERT rejected (RLS violation → 0 rows inserted or error).
-- ============================================================
DO $$
DECLARE
  inserted_count INT;
BEGIN
  -- Attempt INSERT: user_id = auth.uid() (User A), but application_id belongs to User B.
  INSERT INTO application_notes (application_id, user_id, content)
  VALUES (
    '<APP_B_ID>'::uuid,   -- User B's application — NOT owned by User A
    '<USER_A_ID>'::uuid,  -- auth.uid() for User A
    'injected note'
  );
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RAISE NOTICE 'SCENARIO 1 PASS: cross-user note INSERT blocked (0 rows inserted)';
  ELSE
    RAISE EXCEPTION 'SCENARIO 1 FAIL: cross-user note INSERT succeeded unexpectedly (% rows)', inserted_count;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'SCENARIO 1 PASS: cross-user note INSERT blocked with error: %', SQLERRM;
END;
$$;


-- ============================================================
-- SCENARIO 2 — Valid INSERT into own application (REQ-RLS-001 scenario 1)
-- User A inserts a note WITHOUT passing user_id; DEFAULT auth.uid() fills it.
-- Expected: INSERT succeeds; the created row has user_id = User A's UUID.
-- ============================================================
DO $$
DECLARE
  created_user_id UUID;
BEGIN
  INSERT INTO application_notes (application_id, content)
  VALUES (
    '<APP_A_ID>'::uuid,  -- User A's own application
    'valid note'
  )
  RETURNING user_id INTO created_user_id;

  IF created_user_id::text = '<USER_A_ID>' THEN
    RAISE NOTICE 'SCENARIO 2 PASS: valid INSERT succeeded; user_id auto-filled as User A (%).',
      created_user_id;
  ELSE
    RAISE EXCEPTION 'SCENARIO 2 FAIL: user_id is % — expected <USER_A_ID>.', created_user_id;
  END IF;

  -- Clean up the test row so scenarios are repeatable.
  DELETE FROM application_notes
  WHERE content = 'valid note' AND user_id = '<USER_A_ID>'::uuid;
END;
$$;


-- ============================================================
-- SCENARIO 3 — DEFAULT auth.uid() on applications table (REQ-RLS-002)
-- User A inserts an application without user_id; DEFAULT fills it.
-- Expected: row exists with user_id = User A's UUID.
-- ============================================================
DO $$
DECLARE
  created_user_id UUID;
  created_id      UUID;
BEGIN
  INSERT INTO applications (url)
  VALUES ('https://example.com/test-job')
  RETURNING id, user_id INTO created_id, created_user_id;

  IF created_user_id::text = '<USER_A_ID>' THEN
    RAISE NOTICE 'SCENARIO 3 PASS: application INSERT without user_id auto-filled as User A (%).',
      created_user_id;
  ELSE
    RAISE EXCEPTION 'SCENARIO 3 FAIL: user_id is % — expected <USER_A_ID>.', created_user_id;
  END IF;

  -- Clean up.
  DELETE FROM applications WHERE id = created_id;
END;
$$;


-- ============================================================
-- SCENARIO 4 — Cross-user SELECT returns 0 rows (REQ-RLS-003 scenario 1)
-- User A queries applications; User B's rows must be absent.
-- Expected: count of User B's rows visible to User A = 0.
-- ============================================================
DO $$
DECLARE
  b_rows_visible INT;
BEGIN
  SELECT COUNT(*) INTO b_rows_visible
  FROM applications
  WHERE user_id = '<USER_B_ID>'::uuid;

  IF b_rows_visible = 0 THEN
    RAISE NOTICE 'SCENARIO 4 PASS: User B''s applications are invisible to User A (0 rows returned).';
  ELSE
    RAISE EXCEPTION 'SCENARIO 4 FAIL: User A can see % of User B''s application rows.', b_rows_visible;
  END IF;
END;
$$;


-- ============================================================
-- SCENARIO 5 — Cross-user UPDATE returns 0 rows (REQ-RLS-003 scenario 2)
-- User A tries to UPDATE an application owned by User B.
-- Expected: 0 rows affected (RLS silently filters the target row).
-- ============================================================
DO $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE applications
  SET company = 'hacked'
  WHERE id = '<APP_B_ID>'::uuid;
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count = 0 THEN
    RAISE NOTICE 'SCENARIO 5 PASS: cross-user UPDATE blocked (0 rows affected).';
  ELSE
    RAISE EXCEPTION 'SCENARIO 5 FAIL: cross-user UPDATE mutated % rows.', updated_count;
  END IF;
END;
$$;


-- ============================================================
-- SCENARIO 6 — Cross-user DELETE returns 0 rows (REQ-RLS-003 scenario 3)
-- User A tries to DELETE an application owned by User B.
-- Expected: 0 rows deleted.
-- ============================================================
DO $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM applications
  WHERE id = '<APP_B_ID>'::uuid;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  IF deleted_count = 0 THEN
    RAISE NOTICE 'SCENARIO 6 PASS: cross-user DELETE blocked (0 rows deleted).';
  ELSE
    RAISE EXCEPTION 'SCENARIO 6 FAIL: cross-user DELETE removed % rows.', deleted_count;
  END IF;
END;
$$;


-- ============================================================
-- SCENARIO 7 — Unauthenticated INSERT rejected (REQ-RLS-001 scenario 3)
-- Drop the RLS context and attempt an INSERT as anon.
-- Expected: INSERT rejected.
-- ============================================================
RESET role;
SELECT set_config('request.jwt.claims', '{"role":"anon"}', true);
SET LOCAL role = anon;

DO $$
DECLARE
  inserted_count INT;
BEGIN
  INSERT INTO application_notes (application_id, user_id, content)
  VALUES (
    '<APP_A_ID>'::uuid,
    '<USER_A_ID>'::uuid,
    'anon injection'
  );
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RAISE NOTICE 'SCENARIO 7 PASS: unauthenticated INSERT blocked (0 rows inserted).';
  ELSE
    RAISE EXCEPTION 'SCENARIO 7 FAIL: unauthenticated INSERT succeeded (% rows).', inserted_count;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'SCENARIO 7 PASS: unauthenticated INSERT blocked with error: %', SQLERRM;
END;
$$;


-- ============================================================
-- TEARDOWN: restore session role
-- ============================================================
RESET role;
