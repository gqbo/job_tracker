import type { VercelRequest, VercelResponse } from '@vercel/node'
import { generateObject } from 'ai'
import { extractionModel } from './_lib/llm'
import { ExtractedJobSchema, RequestBodySchema } from './_lib/schema'
import { createServerClient } from './_lib/supabase'

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 10,
}

function json(res: VercelResponse, status: number, body: unknown) {
  return res.status(status).json(body)
}

function buildPrompt(html: string, url: string): string {
  return `You are a job data extraction assistant. Extract structured information from the following job posting HTML.

Job posting URL: ${url}

Instructions:
- Extract only information explicitly stated in the HTML — do not infer or guess
- If a field is not present or unclear, return null for that field
- For modality: "remote" means fully remote, "hybrid" means some in-office required, "on_site" means fully in-office; null if not specified
- For salary: return the full range or value as a string (e.g. "$100k-$130k/yr")
- For source: return the job board or platform name if identifiable (e.g. "LinkedIn", "Greenhouse", "Lever")

HTML content:
${html}`
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'method not allowed' })
  }

  // Extract Bearer token
  const authHeader = req.headers['authorization']
  const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  if (!token) {
    return json(res, 401, { error: 'missing authorization token' })
  }

  // Validate JWT via Supabase getUser (uses anon key — not service role)
  const supabase = createServerClient()
  const { data: userRes, error: authErr } = await supabase.auth.getUser(token)

  if (authErr || !userRes?.user) {
    return json(res, 401, { error: 'invalid or expired token' })
  }

  // Parse and validate request body
  const parsed = RequestBodySchema.safeParse(req.body)
  if (!parsed.success) {
    return json(res, 400, {
      error: 'invalid request body',
      details: parsed.error.flatten(),
    })
  }

  const { html, url } = parsed.data

  // Extract structured job data via LLM
  try {
    const { object } = await generateObject({
      model: extractionModel,
      schema: ExtractedJobSchema,
      prompt: buildPrompt(html, url),
    })
    return json(res, 200, { data: object })
  } catch (e) {
    console.error('LLM extraction failed:', e)
    return json(res, 502, { error: 'extraction_failed' })
  }
}
