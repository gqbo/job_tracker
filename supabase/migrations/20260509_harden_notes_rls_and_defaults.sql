-- Slice 1: harden application_notes INSERT policy + DEFAULT auth.uid() on user_id
-- Ships in a single migration (REQ-RLS-004).

-- 1) Replace weak INSERT policy on application_notes with parent-ownership check.
--    The original policy only checked auth.uid() = user_id, which did not verify
--    that the target application_id belongs to the authenticated user. An attacker
--    who knows another user's application UUID could inject notes into it.
DROP POLICY IF EXISTS application_notes_insert ON application_notes;

CREATE POLICY application_notes_insert ON application_notes
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM applications
      WHERE id = application_id
        AND user_id = auth.uid()
    )
  );

-- 2) Set DEFAULT auth.uid() on both user_id columns so clients never need to
--    pass user_id explicitly on INSERT (REQ-RLS-002, REQ-INV-003).
ALTER TABLE applications      ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE application_notes ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Other policies (SELECT, UPDATE, DELETE) on both tables are untouched (REQ-RLS-003).
