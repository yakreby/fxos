import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** PersonnelStatus enum değerleri (backend ile birebir). */
export type PersonnelStatus = 0 | 1 | 2

/** Statü seçenekleri (form dropdown'u ve etiketleme için). */
export const PERSONNEL_STATUS_OPTIONS: { value: PersonnelStatus; label: string }[] = [
  { value: 0, label: 'Aktif' },
  { value: 1, label: 'İzinde' },
  { value: 2, label: 'Ayrıldı' },
]

export interface Personnel {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionName: string | null
  status: PersonnelStatus
  statusLabel: string
  hireDate: string | null
  createdAt: string
}

export interface PersonnelDetail {
  id: string
  firstName: string
  lastName: string
  fullName: string
  nationalId: string | null
  email: string | null
  phone: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionName: string | null
  hireDate: string | null
  status: PersonnelStatus
  statusLabel: string
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface PersonnelPayload {
  firstName: string
  lastName: string
  nationalId?: string | null
  email?: string | null
  phone?: string | null
  departmentId?: string | null
  positionId?: string | null
  hireDate?: string | null
  status: PersonnelStatus
  notes?: string | null
}

export interface PersonnelLookup {
  id: string
  fullName: string
}

export interface Lookup {
  id: string
  name: string
  description: string | null
  personnelCount: number
}

export interface LookupPayload {
  name: string
  description?: string | null
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

/* ---- Personnel ---- */

export interface PersonnelListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  status?: PersonnelStatus
}

export function listPersonnel(query: PersonnelListQuery): Promise<ApiResult<Paged<Personnel>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.status != null) p.set('status', String(query.status))
  return api.get<Paged<Personnel>>(`/personnel?${p.toString()}`)
}
/** Hafif personel listesi (dropdown'lar için; yalnız aktif). */
export function listPersonnelLookup(): Promise<ApiResult<PersonnelLookup[]>> {
  return api.get<PersonnelLookup[]>('/personnel/lookup')
}
export function getPersonnel(id: string): Promise<ApiResult<PersonnelDetail>> {
  return api.get<PersonnelDetail>(`/personnel/${id}`)
}
export function createPersonnel(payload: PersonnelPayload): Promise<ApiResult<string>> {
  return api.post<string>('/personnel', payload)
}
export function updatePersonnel(id: string, payload: PersonnelPayload): Promise<ApiResult> {
  return api.put(`/personnel/${id}`, payload)
}
export function deletePersonnel(id: string): Promise<ApiResult> {
  return api.delete(`/personnel/${id}`)
}

/* ---- Departments ---- */

export function listDepartments(): Promise<ApiResult<Lookup[]>> {
  return api.get<Lookup[]>('/departments')
}
export function createDepartment(payload: LookupPayload): Promise<ApiResult<string>> {
  return api.post<string>('/departments', payload)
}
export function updateDepartment(id: string, payload: LookupPayload): Promise<ApiResult> {
  return api.put(`/departments/${id}`, payload)
}
export function deleteDepartment(id: string): Promise<ApiResult> {
  return api.delete(`/departments/${id}`)
}

/* ---- Positions ---- */

export function listPositions(): Promise<ApiResult<Lookup[]>> {
  return api.get<Lookup[]>('/positions')
}
export function createPosition(payload: LookupPayload): Promise<ApiResult<string>> {
  return api.post<string>('/positions', payload)
}
export function updatePosition(id: string, payload: LookupPayload): Promise<ApiResult> {
  return api.put(`/positions/${id}`, payload)
}
export function deletePosition(id: string): Promise<ApiResult> {
  return api.delete(`/positions/${id}`)
}
