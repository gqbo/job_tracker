import { describe, it, expect } from 'vitest'
import { cleanHtml } from '../clean-html'

describe('cleanHtml', () => {
  it('removes <script> tags and their contents', () => {
    const html = '<html><body><p>Job</p><script>alert("xss")</script></body></html>'
    const result = cleanHtml(html)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('alert("xss")')
    expect(result).toContain('<p>Job</p>')
  })

  it('removes <script src="..."> blocks with no content', () => {
    const html = '<html><script src="https://cdn.example.com/bundle.js"></script><body>Content</body></html>'
    const result = cleanHtml(html)
    expect(result).not.toContain('<script')
    expect(result).toContain('Content')
  })

  it('removes <style> tags and their contents', () => {
    const html = '<html><head><style>.btn { color: red; }</style></head><body>Hello</body></html>'
    const result = cleanHtml(html)
    expect(result).not.toContain('<style>')
    expect(result).not.toContain('.btn { color: red; }')
    expect(result).toContain('Hello')
  })

  it('removes HTML comments', () => {
    const html = '<html><!-- This is a comment --><body><!-- another --><p>Content</p></body></html>'
    const result = cleanHtml(html)
    expect(result).not.toContain('<!--')
    expect(result).not.toContain('-->')
    expect(result).toContain('<p>Content</p>')
  })

  it('removes base64 data URIs from img src attributes', () => {
    const base64 = 'data:image/png;base64,' + 'A'.repeat(500)
    const html = `<html><body><img src="${base64}" /><p>Job title</p></body></html>`
    const result = cleanHtml(html)
    expect(result).not.toContain('data:image/png;base64,')
    expect(result).toContain('<p>Job title</p>')
  })

  it('removes multiple data URIs in the same document', () => {
    const b64 = 'data:image/jpeg;base64,' + 'B'.repeat(200)
    const html = `<div><img src="${b64}" /><img src="${b64}" /><span>Role</span></div>`
    const result = cleanHtml(html)
    expect(result).not.toContain('data:image/jpeg;base64,')
    expect(result).toContain('Role')
  })

  it('handles LinkedIn-style HTML: strips scripts, styles, comments, and data URIs together', () => {
    const b64 = 'data:image/gif;base64,' + 'C'.repeat(300)
    const html = `
      <html>
        <head>
          <!-- LinkedIn tracking -->
          <style>.sponsored { display: block; }</style>
          <script>window.li_pageUrn = "urn:li:page:job_detail";</script>
        </head>
        <body>
          <!-- comment about job -->
          <img src="${b64}" alt="logo" />
          <h1>Senior Engineer</h1>
          <p>Acme Corp · Remote</p>
          <p>$150k - $180k/yr</p>
        </body>
      </html>
    `
    const result = cleanHtml(html)
    expect(result).not.toContain('LinkedIn tracking')
    expect(result).not.toContain('.sponsored')
    expect(result).not.toContain('window.li_pageUrn')
    expect(result).not.toContain('data:image/gif;base64,')
    expect(result).toContain('Senior Engineer')
    expect(result).toContain('Acme Corp')
    expect(result).toContain('$150k - $180k/yr')
  })

  it('truncates output to at most 50KB', () => {
    // ~150KB of repeated content
    const html = '<p>' + 'x'.repeat(150 * 1024) + '</p>'
    const result = cleanHtml(html)
    const byteLength = new TextEncoder().encode(result).length
    expect(byteLength).toBeLessThanOrEqual(50 * 1024)
  })

  it('does not truncate content that is already under 50KB', () => {
    const html = '<html><body><p>Short content</p></body></html>'
    const result = cleanHtml(html)
    expect(result).toBe(html)
  })

  it('returns empty string for empty input', () => {
    expect(cleanHtml('')).toBe('')
  })
})
