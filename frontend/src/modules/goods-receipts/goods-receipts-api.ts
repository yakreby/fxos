import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** GoodsReceiptStatus enum değerleri (backend ile birebir). */
export type GoodsReceiptStatus = 0 | 1 | 2

export const GOODS_RECEIPT_STATUS_OPTIONS: { value: GoodsReceiptStatus; label: string }[] = [
  { value: 0, label: 'Taslak' },
  { value: 1, label: 'Onaylandı' },
  { value: 2, label: 'İptal' },
]

export interface GoodsReceiptListItem {
  id: string
  receiptNumber: string
  receiptDate: string
  supplierId: string | null
  supplierName: string | null
  status: GoodsReceiptStatus
  statusLabel: string
  lineCount: number
  totalQuantity: number
  totalWeight: number
  createdAt: string
}

export interface GoodsReceiptLine {
  id: string
  productId: string
  productCode: string
  productName: string
  shelfId: string | null
  shelfCode: string | null
  quantity: number
  weight: number | null
  note: string | null
}

export interface GoodsReceiptDetail {
  id: string
  receiptNumber: string
  receiptDate: string
  supplierId: string | null
  supplierName: string | null
  status: GoodsReceiptStatus
  statusLabel: string
  notes: string | null
  totalQuantity: number
  totalWeight: number
  createdAt: string
  updatedAt: string | null
  lines: GoodsReceiptLine[]
}

export interface GoodsReceiptPayload {
  receiptNumber?: string | null
  receiptDate: string
  supplierId?: string | null
  notes?: string | null
}

export interface GoodsReceiptLinePayload {
  productId: string
  shelfId?: string | null
  quantity: number
  weight?: number | null
  note?: string | null
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

export interface GoodsReceiptListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  status?: GoodsReceiptStatus
}

/* ---- API ---- */

export function listGoodsReceipts(query: GoodsReceiptListQuery): Promise<ApiResult<Paged<GoodsReceiptListItem>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.status != null) p.set('status', String(query.status))
  return api.get<Paged<GoodsReceiptListItem>>(`/goods-receipts?${p.toString()}`)
}
export function getGoodsReceipt(id: string): Promise<ApiResult<GoodsReceiptDetail>> {
  return api.get<GoodsReceiptDetail>(`/goods-receipts/${id}`)
}
export function createGoodsReceipt(payload: GoodsReceiptPayload): Promise<ApiResult<string>> {
  return api.post<string>('/goods-receipts', payload)
}
export function updateGoodsReceipt(id: string, payload: GoodsReceiptPayload): Promise<ApiResult> {
  return api.put(`/goods-receipts/${id}`, payload)
}
export function deleteGoodsReceipt(id: string): Promise<ApiResult> {
  return api.delete(`/goods-receipts/${id}`)
}
export function confirmGoodsReceipt(id: string): Promise<ApiResult> {
  return api.post(`/goods-receipts/${id}/confirm`, {})
}
export function cancelGoodsReceipt(id: string): Promise<ApiResult> {
  return api.post(`/goods-receipts/${id}/cancel`, {})
}
export function addGoodsReceiptLine(receiptId: string, payload: GoodsReceiptLinePayload): Promise<ApiResult<string>> {
  return api.post<string>(`/goods-receipts/${receiptId}/lines`, payload)
}
export function deleteGoodsReceiptLine(lineId: string): Promise<ApiResult> {
  return api.delete(`/goods-receipts/lines/${lineId}`)
}

/* ---- Yardımcı ---- */

const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })

/** Miktarı tr-TR biçiminde gösterir. */
export function fmtQty(n: number): string {
  return nf.format(n)
}

/** Ağırlığı KG olarak gösterir (null → —). */
export function fmtKg(n: number | null): string {
  return n != null ? `${nf.format(n)} kg` : '—'
}
