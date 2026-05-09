import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

/**
 * Button that copies the current Supabase session JSON to clipboard.
 * The user pastes this into the JobTrackr browser extension popup once
 * to link their session. After the initial paste the extension auto-refreshes
 * via the stored refresh token.
 */
export function ConnectExtensionButton() {
  const [copied, setCopied] = useState(false)

  async function handleConnect() {
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      toast.error('No active session found. Please sign in first.')
      return
    }

    const sessionJson = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    })

    try {
      await navigator.clipboard.writeText(sessionJson)
      setCopied(true)
      toast.success('Session copied! Paste it in the JobTrackr extension popup.')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // Clipboard API may not be available in non-secure contexts
      toast.error('Clipboard unavailable. Copy the session JSON manually.')
      console.warn('Session JSON (copy manually):', sessionJson)
    }
  }

  return (
    <button
      onClick={handleConnect}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f9fafb] transition-colors"
    >
      {copied ? 'Copied!' : 'Connect Extension'}
    </button>
  )
}
