import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** OctabinStatus enum değerleri (backend ile birebir). */
export type OctabinStatus = 0 | 1 | 2

export const OCTABIN_STATUS_OPTIONS: { value: OctabinStatus; label: string }[] = [
  { value: 0, label: 'Açık' },
  { value: 1, label: 'Dolu' },
  { value: 2, label: 'Sevk Edildi' },
]

export interface OctabinListItem {
  id: string
  octabinNumber: string
  status: OctabinStatus
  statusLabel: string
  wasteTypeName: string | null
  productCode: string | null
  productName: string | null
  content: string | null
  shelfCode: string | null
  capacity: number | null
  netWeight: number | null
  fillPercent: number | null
  openedDate: string
  createdAt: string
}

export interface OctabinDetail {
  id: string
  octabinNumber: string
  status: OctabinStatus
  statusLabel: string
  wasteTypeId: string | null
  wasteTypeName: string | null
  productId: string | null
  productCode: string | null
  productName: string | null
  content: string | null
  shelfId: string | null
  shelfCode: string | null
  capacity: number | null
  netWeight: number | null
  fillPercent: number | null
  openedDate: string
  closedDate: string | null
  dispatchedDate: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface OctabinPayload {
  octabinNumber?: string | null
  openedDate: string
  wasteTypeId?: string | null
  productId?: string | null
  content?: string | null
  shelfId?: string | null
  capacity?: number | null
  netWeight?: number | null
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

export interface OctabinListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  status?: OctabinStatus
}

/* ---- API ---- */

export function listOctabins(query: OctabinListQuery): Promise<ApiResult<Paged<OctabinListItem>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.status != null) p.set('status', String(query.status))
  return api.get<Paged<OctabinListItem>>(`/octabins?${p.toString()}`)
}
export function getOctabin(id: string): Promise<ApiResult<OctabinDetail>> {
  return api.get<OctabinDetail>(`/octabins/${id}`)
}
export function createOctabin(payload: OctabinPayload): Promise<ApiResult<string>> {
  return api.post<string>('/octabins', payload)
}
export function updateOctabin(id: string, payload: OctabinPayload): Promise<ApiResult> {
  return api.put(`/octabins/${id}`, payload)
}
export function deleteOctabin(id: string): Promise<ApiResult> {
  return api.delete(`/octabins/${id}`)
}
export function closeOctabin(id: string): Promise<ApiResult> {
  return api.post(`/octabins/${id}/close`, {})
}
export function reopenOctabin(id: string): Promise<ApiResult> {
  return api.post(`/octabins/${id}/reopen`, {})
}
export function dispatchOctabin(id: string): Promise<ApiResult> {
  return api.post(`/octabins/${id}/dispatch`, {})
}

/* ---- Yardımcı ---- */

const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })

/** Ağırlığı KG olarak gösterir (null → —). */
export function fmtKg(n: number | null): string {
  return n != null ? `${nf.format(n)} kg` : '—'
}

/** Doluluk yüzdesini gösterir (null → —). */
export function fmtPercent(n: number | null): string {
  return n != null ? `%${nf.format(n)}` : '—'
}
