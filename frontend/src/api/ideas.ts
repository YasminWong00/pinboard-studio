import { getSupabaseClient } from '../lib/supabase'

export type Category = 'Idea' | 'Note' | 'Reference' | 'Task' | 'Research'
export type IdeaStatus = 'Unsorted' | 'Saved' | 'In Progress' | 'Done' | 'Rejected' | 'Archived'

export type IdeaCard = {
  id: string
  title: string
  category: Category
  status: IdeaStatus
  source: string
  summary: string
  tags: string[]
  relatedIds: string[]
  x: number
  y: number
  rotation: number
  z: number
  accent: string
  createdAt: string
  updatedAt?: string
}

export type IdeaPayload = {
  title: string
  category: Category
  status: IdeaStatus
  source?: string | null
  summary: string
  tags?: string[]
  related_ids?: Array<number | string>
  x?: number
  y?: number
  rotation?: number
  z?: number
  accent?: string
}

type ApiIdeaCard = {
  id: number | string
  title: string
  category: Category
  status: IdeaStatus
  source: string | null
  summary: string
  tags: string[] | null
  related_ids: Array<number | string> | null
  x: number
  y: number
  rotation: number | string
  z: number
  accent: string
  created_at: string
  updated_at?: string
}

type LaravelResponse<T> = {
  data: T
}

const DATA_SOURCE = String(import.meta.env.VITE_DATA_SOURCE ?? 'laravel')
  .trim()
  .toLowerCase()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

function isSupabaseSource() {
  return DATA_SOURCE === 'supabase'
}

function normalizeIdea(row: ApiIdeaCard): IdeaCard {
  return {
    id: String(row.id),
    title: row.title,
    category: row.category,
    status: row.status,
    source: row.source ?? 'Workspace note',
    summary: row.summary,
    tags: Array.isArray(row.tags) ? row.tags : [],
    relatedIds: Array.isArray(row.related_ids) ? row.related_ids.map(String) : [],
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    rotation: Number(row.rotation ?? 0),
    z: Number(row.z ?? 1),
    accent: row.accent ?? '#8b5cf6',
    createdAt: (row.created_at ?? new Date().toISOString()).slice(0, 10),
    updatedAt: row.updated_at,
  }
}

async function laravelRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`Laravel request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function getIdeas(): Promise<IdeaCard[]> {
  if (isSupabaseSource()) {
    const { data, error } = await getSupabaseClient()
      .from('idea_cards')
      .select('*')
      .order('z', { ascending: true })

    if (error) throw error

    return (data ?? []).map((row) => normalizeIdea(row as ApiIdeaCard))
  }

  const response = await laravelRequest<LaravelResponse<ApiIdeaCard[]>>('/ideas')

  return response.data.map(normalizeIdea)
}

export async function createIdea(payload: IdeaPayload): Promise<IdeaCard> {
  if (isSupabaseSource()) {
    const { data, error } = await getSupabaseClient()
      .from('idea_cards')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    return normalizeIdea(data as ApiIdeaCard)
  }

  const response = await laravelRequest<LaravelResponse<ApiIdeaCard>>('/ideas', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return normalizeIdea(response.data)
}

export async function updateIdea(id: string, payload: Partial<IdeaPayload>): Promise<IdeaCard> {
  if (isSupabaseSource()) {
    const { data, error } = await getSupabaseClient()
      .from('idea_cards')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return normalizeIdea(data as ApiIdeaCard)
  }

  const response = await laravelRequest<LaravelResponse<ApiIdeaCard>>(`/ideas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return normalizeIdea(response.data)
}

export async function deleteIdea(id: string): Promise<void> {
  if (isSupabaseSource()) {
    const { error } = await getSupabaseClient().from('idea_cards').delete().eq('id', id)

    if (error) throw error

    return
  }

  await laravelRequest(`/ideas/${id}`, {
    method: 'DELETE',
  })
}
