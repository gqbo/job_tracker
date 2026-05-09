import { z } from 'zod'

/**
 * Schema for the structured job data extracted by the LLM.
 * All fields are nullable — the LLM may not find every field.
 * `status` is intentionally absent: the extension defaults to 'bookmarked' on INSERT.
 */
export const ExtractedJobSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  modality: z.enum(['remote', 'hybrid', 'on_site']).nullable(),
  location: z.string().nullable(),
  salary: z.string().nullable(),
  source: z.string().nullable(),
})

export type ExtractedJob = z.infer<typeof ExtractedJobSchema>

/**
 * Schema for the incoming request body.
 */
export const RequestBodySchema = z.object({
  html: z.string().min(1).max(200_000),
  url: z.string().url(),
})

export type RequestBody = z.infer<typeof RequestBodySchema>
