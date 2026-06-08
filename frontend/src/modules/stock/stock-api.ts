import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

export type StockDirection = 0 | 1
export type StockMovementType = 0 | 1 | 2 | 3 | 4

export const STOCK_DIRECTION_OPTIONS: { value: StockDirection; label: string }[] = [
  { value: 0, label: 'Giriş' },
  { value: 1, label: 'Çıkış' },
]

export const STOCK_TYPE_OPTIONS: { value: StockMovementType; label: string }[] = [
  { value: 0, label: 'Mal Kabul' },
  { value: 1, label: 'Çıkış' },
  { value: 2, label: 'Transfer' },
  { value: 3, label: 'Düzeltme' },
  { value: 4, label: 'Sayım' },
]

export interface Shelf {
  id: string
  code: string
  name: string
  capacity: number | null
  isActive: boolean
  notes: string | null
  quantityOnHand: number
  weightOnHand: number
  productCount: number
}

export interface ShelfPayload {
  code: string
  name: string
  capacity?: number | null
  isActive: boolean
  notes?: string | null
}

export interface StockItem {
  productId: string
  productCode: string
  productName: string
  quantityOnHand: number
  weightOnHand: number
}

export interface StockMovement {
  id: string
  productId: string
  productCode: string
  productName: string
  shelfId: string | null
  shelfCode: string | null
  direction: StockDirection
  directionLabel: string
  type: StockMovementType
  typeLabel: string
  quantity: number
  weight: number | null
  movementDate: string
  reference: string | null
  note: string | null
  createdAt: string
}

export interface StockMovementPayload {
  productId: string
  shelfId?: string | null
  direction: StockDirection
  type: StockMovementType
  quantity: number
  weight?: number | null
  movementDate: string
  reference?: string | null
  note?: string | null
}

export interface TransferPayload {
  productId: string
  fromShelfId: string
  toShelfId: string
  quantity: number
  weight?: number | null
  movementDate: string
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

export interface StockMovementListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  productId?: string
  shelfId?: string
  type?: StockMovementType
}

/* ---- Raflar ---- */

export function listShelves(): Promise<ApiResult<Shelf[]>> {
  return api.get<Shelf[]>('/shelves')
}
export function createShelf(payload: ShelfPayload): Promise<ApiResult<string>> {
  return api.post<string>('/shelves', payload)
}
export function updateShelf(id: string, payload: ShelfPayload): Promise<ApiResult> {
  return api.put(`/shelves/${id}`, payload)
}
export function deleteShelf(id: string): Promise<ApiResult> {
  return api.delete(`/shelves/${id}`)
}

/* ---- Stok durumu + hareketler ---- */

export function listStock(shelfId?: string, search?: string): Promise<ApiResult<StockItem[]>> {
  const p = new URLSearchParams()
  if (shelfId) p.set('shelfId', shelfId)
  if (search?.trim()) p.set('search', search.trim())
  const q = p.toString()
  return api.get<StockItem[]>(`/stock${q ? `?${q}` : ''}`)
}

export function listStockMovements(query: StockMovementListQuery): Promise<ApiResult<Paged<StockMovement>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.productId) p.set('productId', query.productId)
  if (query.shelfId) p.set('shelfId', query.shelfId)
  if (query.type != null) p.set('type', String(query.type))
  return api.get<Paged<StockMovement>>(`/stock/movements?${p.toString()}`)
}
export function createStockMovement(payload: StockMovementPayload): Promise<ApiResult<string>> {
  return api.post<string>('/stock/movements', payload)
}
export function transferStock(payload: TransferPayload): Promise<ApiResult> {
  return api.post('/stock/transfer', payload)
}
export function deleteStockMovement(id: string): Promise<ApiResult> {
  return api.delete(`/stock/movements/${id}`)
}

/* ---- Yardımcı ---- */

const nf = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 3 })
export const fmtNum = (n: number): string => nf.format(n)
export const fmtKg = (n: number | null): string => (n != null ? `${nf.format(n)} kg` : '—')
