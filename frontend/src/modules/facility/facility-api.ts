import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** FacilityNodeType (backend ile birebir). */
export type FacilityNodeType = 0 | 1 | 2 | 3 // Genel Merkez / Toplama Merkezi / Tesis / Dağıtım Merkezi

/** FacilityNodeStatus (backend ile birebir). */
export type FacilityNodeStatus = 0 | 1 | 2 // Aktif / Planlı / Pasif

export interface FacilityNode {
  id: string
  name: string
  city: string
  nodeType: FacilityNodeType
  nodeTypeLabel: string
  status: FacilityNodeStatus
  statusLabel: string
  latitude: number
  longitude: number
  description: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string | null
}

export interface FacilityNodePayload {
  name: string
  city: string
  nodeType: FacilityNodeType
  status: FacilityNodeStatus
  latitude: number
  longitude: number
  description?: string | null
  sortOrder: number
}

/* ---- Seçenekler (backend etiketleriyle birebir) ---- */

export const NODE_TYPE_OPTIONS: { value: FacilityNodeType; label: string }[] = [
  { value: 0, label: 'Genel Merkez' },
  { value: 1, label: 'Toplama Merkezi' },
  { value: 2, label: 'Tesis' },
  { value: 3, label: 'Dağıtım Merkezi' },
]

export const NODE_STATUS_OPTIONS: { value: FacilityNodeStatus; label: string }[] = [
  { value: 0, label: 'Aktif' },
  { value: 1, label: 'Planlı' },
  { value: 2, label: 'Pasif' },
]

/* ---- API ---- */

/** Tüm harita noktalarını getirir (sayfalanmaz). */
export function listFacilityNodes(): Promise<ApiResult<FacilityNode[]>> {
  return api.get<FacilityNode[]>('/facility/nodes')
}
export function getFacilityNode(id: string): Promise<ApiResult<FacilityNode>> {
  return api.get<FacilityNode>(`/facility/nodes/${id}`)
}
export function createFacilityNode(payload: FacilityNodePayload): Promise<ApiResult<string>> {
  return api.post<string>('/facility/nodes', payload)
}
export function updateFacilityNode(id: string, payload: FacilityNodePayload): Promise<ApiResult> {
  return api.put(`/facility/nodes/${id}`, payload)
}
export function deleteFacilityNode(id: string): Promise<ApiResult> {
  return api.delete(`/facility/nodes/${id}`)
}
