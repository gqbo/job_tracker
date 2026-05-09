import { groq } from '@ai-sdk/groq'
// import { google } from '@ai-sdk/google'
// import { anthropic } from '@ai-sdk/anthropic'
// import { openai } from '@ai-sdk/openai'

/**
 * The model used for job extraction.
 * To swap providers: change this one line only.
 * All providers must be AI SDK-compatible (satisfies LanguageModel).
 *
 * Requires env: GROQ_API_KEY
 */
export const extractionModel = groq('llama-3.3-70b-versatile')
