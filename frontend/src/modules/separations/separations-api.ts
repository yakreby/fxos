import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** SeparationStatus enum değerleri (backend ile birebir). */
export type SeparationStatus = 0 | 1 | 2 | 3

export const SEPARATION_STATUS_OPTIONS: { value: SeparationStatus; label: string }[] = [
  { value: 0, label: 'Beklemede' },
  { value: 1, label: 'Ayrıştırılıyor' },
  { value: 2, label: 'Tamamlandı' },
  { value: 3, label: 'İptal' },
]

export interface SeparationListItem {
  id: string
  requestNumber: string
  requestDate: string
  status: SeparationStatus
  statusLabel: string
  assignedPersonnelId: string | null
  assignedPersonnelName: string | null
  processTypeName: string | null
  wasteTypeName: string | null
  content: string | null
  palletCount: number | null
  weight: number | null
  createdAt: string
}

export interface SeparationDetail {
  id: string
  requestNumber: string
  requestDate: string
  status: SeparationStatus
  statusLabel: string
  assignedPersonnelId: string | null
  assignedPersonnelName: string | null
  wasteTypeId: string | null
  wasteTypeName: string | null
  processTypeId: string | null
  processTypeName: string | null
  resultGroupId: string | null
  resultGroupName: string | null
  productId: string | null
  productCode: string | null
  productName: string | null
  shelfId: string | null
  shelfCode: string | null
  content: string | null
  palletCount: number | null
  weight: number | null
  completedDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface SeparationPayload {
  requestNumber?: string | null
  requestDate: string
  assignedPersonnelId?: string | null
  wasteTypeId?: string | null
  processTypeId?: string | null
  resultGroupId?: string | null
  productId?: string | null
  shelfId?: string | null
  content?: string | null
  palletCount?: number | null
  weight?: number | null
  notes?: string | null
}

export interface Paged<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
}

export interface SeparationListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  status?: SeparationStatus
}

/* ---- API ---- */

export function listSeparations(query: SeparationListQuery): Promise<ApiResult<Paged<SeparationListItem>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.status != null) p.set('status', String(query.status))
  return api.get<Paged<SeparationListItem>>(`/separations?${p.toString()}`)
}
export function getSeparation(id: string): Promise<ApiResult<SeparationDetail>> {
  return api.get<SeparationDetail>(`/separations/${id}`)
}
export function createSeparation(payload: SeparationPayload): Promise<ApiResult<string>> {
  return api.post<string>('/separations', payload)
}
export function updateSeparation(id: string, payload: SeparationPayload): Promise<ApiResult> {
  return api.put(`/separations/${id}`, payload)
}
export function deleteSeparation(id: string): Promise<ApiResult> {
  return api.delete(`/separations/${id}`)
}
export function startSeparation(id: string): Promise<ApiResult> {
  return api.post(`/separations/${id}/start`, {})
}
export function completeSeparation(id: string): Promise<ApiResult> {
  return api.post(`/separations/${id}/complete`, {})
}
export function reopenSeparation(id: string): Promise<ApiResult> {
  return api.post(`/separations/${id}/reopen`, {})
}
export function cancelSeparation(id: string): Promise<ApiResult> {
  return api.post(`/separations/${id}/cancel`, {})
}

/* ---- Yardımcı ---- */

const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })

/** Ağırlığı KG olarak gösterir (null → —). */
export function fmtKg(n: number | null): string {
  return n != null ? `${nf.format(n)} kg` : '—'
}

/** Sayıyı gösterir (null → —). */
export function fmtNum(n: number | null): string {
  return n != null ? nf.format(n) : '—'
}
