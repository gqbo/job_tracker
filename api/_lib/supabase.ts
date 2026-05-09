import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing server env vars: SUPABASE_URL and SUPABASE_ANON_KEY must be set')
}

/**
 * Creates a fresh Supabase client per request.
 * Uses the anon key — authentication relies on JWT verification via getUser().
 * The service-role key is intentionally NOT used here (REQ-INV-001).
 */
export function createServerClient() {
  return createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
