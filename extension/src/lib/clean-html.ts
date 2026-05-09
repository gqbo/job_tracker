/**
 * Strips scripts, styles, HTML comments, and data URIs from raw HTML,
 * then truncates to ~50KB. Used before sending HTML to the Vercel Function
 * to reduce payload size and remove irrelevant content.
 */

const MAX_BYTES = 50 * 1024 // 50KB

/**
 * Removes <script>...</script> blocks (including inline and src-only).
 */
function stripScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
}

/**
 * Removes <style>...</style> blocks.
 */
function stripStyles(html: string): string {
  return html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
}

/**
 * Removes HTML comments (<!-- ... -->).
 */
function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

/**
 * Replaces data URI attribute values (data:...) with an empty string.
 * Covers src="data:..." and similar attribute patterns.
 */
function stripDataUris(html: string): string {
  // Match data URI values in attributes (quoted or unquoted)
  return html.replace(/(['"]?)data:[a-z]+\/[a-z0-9+.-]+;base64,[^'"\s>]*/gi, '$1')
}

/**
 * Truncates a string to at most `maxBytes` UTF-8 bytes.
 * Cuts at the last complete character before the limit.
 */
function truncateToBytes(str: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  if (encoded.length <= maxBytes) return str

  // Decode only up to maxBytes — TextDecoder handles incomplete sequences
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(encoded.slice(0, maxBytes))
}

/**
 * Cleans raw HTML for LLM extraction:
 * 1. Strip <script> tags and contents
 * 2. Strip <style> tags and contents
 * 3. Strip HTML comments
 * 4. Strip data: URI attribute values
 * 5. Truncate to 50KB
 */
export function cleanHtml(raw: string): string {
  let cleaned = raw
  cleaned = stripScripts(cleaned)
  cleaned = stripStyles(cleaned)
  cleaned = stripComments(cleaned)
  cleaned = stripDataUris(cleaned)
  cleaned = truncateToBytes(cleaned, MAX_BYTES)
  return cleaned
}
