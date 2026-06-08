import { api, type ApiResult } from '../../core/api/client'

/* ---- Tipler (backend DTO karşılıkları) ---- */

/** PackageType enum değerleri (backend ile birebir). */
export type PackageType = 0 | 1 | 2

/** Ambalaj türü seçenekleri (sabit enum). */
export const PACKAGE_TYPE_OPTIONS: { value: PackageType; label: string }[] = [
  { value: 0, label: 'Adet' },
  { value: 1, label: 'Paket' },
  { value: 2, label: 'Koli' },
]

export interface ProductLookup {
  id: string
  productCode: string
  name: string
}

export interface ProductListItem {
  id: string
  productCode: string
  barcode: string | null
  name: string
  customerId: string | null
  customerName: string | null
  packageType: PackageType
  packageTypeLabel: string
  netWeight: number | null
  productGroupName: string | null
  isActive: boolean
  createdAt: string
}

export interface ProductDetail {
  id: string
  productCode: string
  barcode: string | null
  name: string
  customerId: string | null
  customerName: string | null
  netWeight: number | null
  grossWeight: number | null
  packageType: PackageType
  packageTypeLabel: string
  unitsPerPackage: number | null
  unitsPerCase: number | null
  productGroupId: string | null
  productGroupName: string | null
  returnGroupId: string | null
  returnGroupName: string | null
  wasteGroupId: string | null
  wasteGroupName: string | null
  processTypeId: string | null
  processTypeName: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface ProductPayload {
  customerId?: string | null
  productCode: string
  barcode?: string | null
  name: string
  netWeight?: number | null
  grossWeight?: number | null
  packageType: PackageType
  unitsPerPackage?: number | null
  unitsPerCase?: number | null
  productGroupId?: string | null
  returnGroupId?: string | null
  wasteGroupId?: string | null
  processTypeId?: string | null
  isActive: boolean
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

export interface ProductListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  customerId?: string
}

/* ---- API ---- */

export function listProducts(query: ProductListQuery): Promise<ApiResult<Paged<ProductListItem>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.customerId) p.set('customerId', query.customerId)
  return api.get<Paged<ProductListItem>>(`/products?${p.toString()}`)
}
/** Hafif ürün listesi (dropdown'lar için; yalnız aktif). */
export function listProductsLookup(): Promise<ApiResult<ProductLookup[]>> {
  return api.get<ProductLookup[]>('/products/lookup')
}
export function getProduct(id: string): Promise<ApiResult<ProductDetail>> {
  return api.get<ProductDetail>(`/products/${id}`)
}
export function createProduct(payload: ProductPayload): Promise<ApiResult<string>> {
  return api.post<string>('/products', payload)
}
export function updateProduct(id: string, payload: ProductPayload): Promise<ApiResult> {
  return api.put(`/products/${id}`, payload)
}
export function deleteProduct(id: string): Promise<ApiResult> {
  return api.delete(`/products/${id}`)
}
