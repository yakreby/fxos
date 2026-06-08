import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** DefinitionType enum değerleri (backend ile birebir). */
export type DefinitionType = 0 | 1 | 2 | 3 | 4 | 5

export interface DefinitionTypeOption {
  value: DefinitionType
  label: string
}

export interface Definition {
  id: string
  type: DefinitionType
  typeLabel: string
  code: string | null
  name: string
  isActive: boolean
  sortOrder: number
  createdAt: string
}

export interface CreateDefinitionPayload {
  type: DefinitionType
  code?: string | null
  name: string
  isActive: boolean
  sortOrder: number
}

export interface UpdateDefinitionPayload {
  code?: string | null
  name: string
  isActive: boolean
  sortOrder: number
}

/* ---- API ---- */

export function listDefinitionTypes(): Promise<ApiResult<DefinitionTypeOption[]>> {
  return api.get<DefinitionTypeOption[]>('/definitions/types')
}
export function listDefinitions(type: DefinitionType): Promise<ApiResult<Definition[]>> {
  return api.get<Definition[]>(`/definitions?type=${type}`)
}
export function createDefinition(payload: CreateDefinitionPayload): Promise<ApiResult<string>> {
  return api.post<string>('/definitions', payload)
}
export function updateDefinition(id: string, payload: UpdateDefinitionPayload): Promise<ApiResult> {
  return api.put(`/definitions/${id}`, payload)
}
export function deleteDefinition(id: string): Promise<ApiResult> {
  return api.delete(`/definitions/${id}`)
}
