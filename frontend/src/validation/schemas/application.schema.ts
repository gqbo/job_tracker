import { z } from 'zod'

export const addApplicationSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  company: z.string().optional(),
  role: z.string().optional(),
  modality: z.enum(['remote', 'hybrid', 'on_site', '']).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['bookmarked', 'applied', 'interviewing', 'accepted', 'rejected', 'ghosted']).optional(),
})

export const noteSchema = z.object({
  content: z.string().min(1, 'Note cannot be empty').transform(v => v.trim()).refine(v => v.length > 0, 'Note cannot be empty'),
})

export type AddApplicationFormValues = z.infer<typeof addApplicationSchema>
export type NoteFormValues = z.infer<typeof noteSchema>
