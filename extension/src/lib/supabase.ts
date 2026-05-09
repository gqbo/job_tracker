import { createClient } from '@supabase/supabase-js'

// Injected at build time via vite.config.ts define()
declare const __SUPABASE_URL__: string
declare const __SUPABASE_ANON_KEY__: string

if (!__SUPABASE_URL__ || !__SUPABASE_ANON_KEY__) {
  throw new Error('Extension: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set at build time')
}

export const supabase = createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
    storage: {
      // Store session in chrome.storage.local instead of localStorage
      async getItem(key: string): Promise<string | null> {
        return new Promise((resolve) => {
          chrome.storage.local.get(key, (result) => {
            resolve(result[key] ?? null)
          })
        })
      },
      async setItem(key: string, value: string): Promise<void> {
        return new Promise((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve)
        })
      },
      async removeItem(key: string): Promise<void> {
        return new Promise((resolve) => {
          chrome.storage.local.remove(key, resolve)
        })
      },
    },
  },
})

/**
 * Restore session from chrome.storage.local.
 * Call this on extension startup before any auth-dependent operations.
 */
export async function restoreSession(): Promise<void> {
  const stored = await new Promise<string | null>((resolve) => {
    chrome.storage.local.get('supabaseSession', (result) => {
      resolve(result['supabaseSession'] ?? null)
    })
  })

  if (!stored) return

  try {
    const session = JSON.parse(stored)
    if (session?.access_token && session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      })
    }
  } catch {
    // Corrupted session data — silently ignore
  }
}
