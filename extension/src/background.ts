/**
 * Background service worker — MV3
 *
 * Message routing between popup and content script.
 * Holds the Supabase client and JWT for the lifetime of the service worker.
 *
 * Supported messages:
 *   { type: 'GET_SESSION' }       → { session } | { session: null }
 *   { type: 'SET_SESSION', data } → { ok: true } | { error }
 *   { type: 'EXTRACT', tabId, url } → { data: ExtractedJob } | { error }
 *   { type: 'SAVE', fields, url }  → { ok: true } | { error }
 */

import { supabase, restoreSession } from './lib/supabase'

declare const __API_BASE_URL__: string

// Restore session on service worker startup
restoreSession().catch(console.error)

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'GET_SESSION':
      handleGetSession().then(sendResponse).catch((e) => sendResponse({ error: String(e) }))
      return true // keep message channel open for async

    case 'SET_SESSION':
      handleSetSession(message.data).then(sendResponse).catch((e) => sendResponse({ error: String(e) }))
      return true

    case 'EXTRACT':
      handleExtract(message.tabId, message.url).then(sendResponse).catch((e) => sendResponse({ error: String(e) }))
      return true

    case 'SAVE':
      handleSave(message.fields, message.url).then(sendResponse).catch((e) => sendResponse({ error: String(e) }))
      return true

    default:
      sendResponse({ error: `unknown message type: ${message.type}` })
      return false
  }
})

async function handleGetSession() {
  const { data } = await supabase.auth.getSession()
  return { session: data.session }
}

async function handleSetSession(sessionJson: string) {
  try {
    const parsed = typeof sessionJson === 'string' ? JSON.parse(sessionJson) : sessionJson
    await chrome.storage.local.set({ supabaseSession: JSON.stringify(parsed) })
    const { error } = await supabase.auth.setSession({
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    })
    if (error) throw error
    return { ok: true }
  } catch (e) {
    return { error: String(e) }
  }
}

async function handleExtract(tabId: number, url: string) {
  // 1. Inject content script to get cleaned HTML
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content.ts'],
  })

  const cleanedHtml = results?.[0]?.result as string | undefined
  if (!cleanedHtml) {
    return { error: 'Failed to read page content. Try refreshing the tab.' }
  }

  // 2. Get JWT from current session
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) {
    return { error: 'Not authenticated. Please reconnect the extension.' }
  }

  // 3. POST to Vercel Function with 12s timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 12_000)

  try {
    const apiBase = __API_BASE_URL__ || ''
    const response = await fetch(`${apiBase}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ html: cleanedHtml, url }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return { error: body.error ?? `Server error (${response.status})` }
    }

    const body = await response.json()
    return { data: body.data }
  } catch (e) {
    clearTimeout(timeoutId)
    if ((e as Error).name === 'AbortError') {
      return { error: 'Extraction timed out. The page may be too large.' }
    }
    return { error: String(e) }
  }
}

async function handleSave(
  fields: {
    company?: string | null
    role?: string | null
    modality?: 'remote' | 'hybrid' | 'on_site' | null
    location?: string | null
    salary?: string | null
    source?: string | null
  },
  url: string,
) {
  const { error } = await supabase.from('applications').insert({
    url,
    company: fields.company ?? null,
    role: fields.role ?? null,
    modality: fields.modality ?? null,
    location: fields.location ?? null,
    salary: fields.salary ?? null,
    source: fields.source ?? null,
    status: 'bookmarked',
    // user_id is set by DB DEFAULT auth.uid() — not passed here (REQ-INV-003)
  })

  if (error) return { error: error.message }
  return { ok: true }
}
