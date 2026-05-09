/**
 * Content script — programmatically injected by the background service worker
 * when the user clicks "Extract" in the popup.
 *
 * This file is NOT a persistent content script. It is injected on demand via
 * chrome.scripting.executeScript(), so it runs in the active tab's context.
 *
 * Returns the cleaned outerHTML to the caller as the function's return value.
 */

function stripScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
}

function stripStyles(html: string): string {
  return html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
}

function stripComments(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function stripDataUris(html: string): string {
  return html.replace(/(['"]?)data:[a-z]+\/[a-z0-9+.-]+;base64,[^'"\s>]*/gi, '$1')
}

function truncateToBytes(str: string, maxBytes: number): string {
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)
  if (encoded.length <= maxBytes) return str
  const decoder = new TextDecoder('utf-8', { fatal: false })
  return decoder.decode(encoded.slice(0, maxBytes))
}

// Execute immediately and return the cleaned HTML
const MAX_BYTES = 50 * 1024
let html = document.documentElement.outerHTML
html = stripScripts(html)
html = stripStyles(html)
html = stripComments(html)
html = stripDataUris(html)
html = truncateToBytes(html, MAX_BYTES)

// The return value of an executeScript func is what gets passed back
;(function () {
  return html
})()
