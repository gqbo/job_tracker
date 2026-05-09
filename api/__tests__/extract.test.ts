import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VercelRequest, VercelResponse } from '@vercel/node'

// Mock the LLM module so tests never call Groq
vi.mock('../_lib/llm', () => ({
  extractionModel: 'mock-model',
}))

// Mock generateObject from the ai package
vi.mock('ai', () => ({
  generateObject: vi.fn(),
}))

// Mock the supabase server client
vi.mock('../_lib/supabase', () => ({
  createServerClient: vi.fn(),
}))

import { generateObject } from 'ai'
import { createServerClient } from '../_lib/supabase'
import handler from '../extract'

// ----- helpers -----

const VALID_BODY = {
  html: '<html><body><h1>Software Engineer at Acme</h1><p>Remote, $120k-$150k</p></body></html>',
  url: 'https://jobs.acme.com/software-engineer',
}

const EXTRACTED_JOB = {
  company: 'Acme',
  role: 'Software Engineer',
  modality: 'remote',
  location: null,
  salary: '$120k-$150k',
  source: null,
}

function mockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer valid-jwt' },
    body: VALID_BODY,
    ...overrides,
  } as VercelRequest
}

function mockResponse(): { res: VercelResponse; status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> } {
  const jsonFn = vi.fn()
  const statusFn = vi.fn().mockReturnValue({ json: jsonFn })
  const res = { status: statusFn, json: jsonFn } as unknown as VercelResponse
  return { res, status: statusFn, json: jsonFn }
}

function mockValidAuth() {
  ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      }),
    },
  })
}

function mockInvalidAuth() {
  ;(createServerClient as ReturnType<typeof vi.fn>).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid JWT' },
      }),
    },
  })
}

// ----- tests -----

describe('POST /api/extract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 405 for non-POST methods', async () => {
    const req = mockRequest({ method: 'GET' })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(405)
  })

  it('returns 401 when Authorization header is missing', async () => {
    const req = mockRequest({ headers: {} })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(401)
    // Ensure no LLM call was made
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 401 when Authorization header has wrong format', async () => {
    const req = mockRequest({ headers: { authorization: 'Token not-bearer' } })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(401)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 401 when JWT is invalid (getUser returns error)', async () => {
    mockInvalidAuth()
    const req = mockRequest()
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(401)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 400 when html field is missing', async () => {
    mockValidAuth()
    const req = mockRequest({ body: { url: 'https://jobs.acme.com/role' } })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 400 when html is empty string', async () => {
    mockValidAuth()
    const req = mockRequest({ body: { html: '', url: 'https://jobs.acme.com/role' } })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 400 when url is not a valid URL', async () => {
    mockValidAuth()
    const req = mockRequest({ body: { html: '<html>content</html>', url: 'not-a-url' } })
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(400)
    expect(generateObject).not.toHaveBeenCalled()
  })

  it('returns 200 with extracted data on valid request', async () => {
    mockValidAuth()
    ;(generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({ object: EXTRACTED_JOB })

    const req = mockRequest()
    const { res, status, json } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ data: EXTRACTED_JOB })
  })

  it('does not call supabase.from() — function is stateless (REQ-EXT-005)', async () => {
    mockValidAuth()
    ;(generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({ object: EXTRACTED_JOB })

    const mockClient = (createServerClient as ReturnType<typeof vi.fn>).mock.results[0]?.value
    const fromSpy = vi.fn()

    // Attach a 'from' spy to the client if it exists
    if (mockClient) {
      mockClient.from = fromSpy
    }

    const req = mockRequest()
    const { res } = mockResponse()
    await handler(req, res)

    expect(fromSpy).not.toHaveBeenCalled()
  })

  it('returns 502 when LLM throws', async () => {
    mockValidAuth()
    ;(generateObject as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Groq timeout'))

    const req = mockRequest()
    const { res, status } = mockResponse()

    await handler(req, res)

    expect(status).toHaveBeenCalledWith(502)
  })
})
