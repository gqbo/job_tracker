import { supabase } from '@/lib/supabase'
import type {
  Application, ApplicationNote,
  CreateApplicationPayload, UpdateApplicationPayload, CreateNotePayload,
} from '@/types'

export async function listApplications(): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) throw error
  return data
}

export async function createApplication(payload: CreateApplicationPayload): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getApplication(id: string): Promise<Application | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateApplication(id: string, payload: UpdateApplicationPayload): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function listNotes(applicationId: string): Promise<ApplicationNote[]> {
  const { data, error } = await supabase
    .from('application_notes')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNote(applicationId: string, payload: CreateNotePayload): Promise<ApplicationNote> {
  const { data, error } = await supabase
    .from('application_notes')
    .insert({ ...payload, application_id: applicationId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('application_notes')
    .delete()
    .eq('id', noteId)
  if (error) throw error
}
