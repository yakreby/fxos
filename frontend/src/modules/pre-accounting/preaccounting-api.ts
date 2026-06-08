import { api, type ApiResult } from '../../core/api/client'

export type AccountType = 0 | 1 | 2
export type TransactionType = 0 | 1 | 2 | 3
export type TransactionDirection = 0 | 1
export type PaymentMethod = 0 | 1 | 2 | 3

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 0, label: 'Müşteri' },
  { value: 1, label: 'Tedarikçi' },
  { value: 2, label: 'Müşteri/Tedarikçi' },
]

/** MVP'de işlem türü: Tahsilat / Ödeme. */
export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 0, label: 'Tahsilat' },
  { value: 1, label: 'Ödeme' },
]

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 0, label: 'Nakit' },
  { value: 1, label: 'Banka' },
  { value: 2, label: 'Kart' },
  { value: 3, label: 'Diğer' },
]

export interface AccountLookup {
  id: string
  name: string
  typeLabel: string
}

export interface AccountListItem {
  id: string
  name: string
  type: AccountType
  typeLabel: string
  phone: string | null
  balance: number
  createdAt: string
}

export interface AccountDetail {
  id: string
  name: string
  type: AccountType
  typeLabel: string
  taxNumber: string | null
  phone: string | null
  email: string | null
  address: string | null
  openingBalance: number
  balance: number
  notes: string | null
  createdAt: string
}

export interface AccountPayload {
  name: string
  type: AccountType
  taxNumber?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  openingBalance: number
  notes?: string | null
}

export interface Transaction {
  id: string
  accountId: string | null
  type: TransactionType
  typeLabel: string
  direction: TransactionDirection
  directionLabel: string
  amount: number
  date: string
  method: PaymentMethod
  methodLabel: string
  description: string | null
  reference: string | null
  createdAt: string
}

export interface CreateTransactionPayload {
  type: TransactionType
  amount: number
  date: string
  method: PaymentMethod
  description?: string | null
  reference?: string | null
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

export interface AccountListQuery {
  page: number
  pageSize: number
  search?: string
  sortBy?: string | null
  sortDescending?: boolean
  type?: AccountType
}

/* ---- Cari ---- */

export function listAccounts(query: AccountListQuery): Promise<ApiResult<Paged<AccountListItem>>> {
  const p = new URLSearchParams()
  p.set('page', String(query.page))
  p.set('pageSize', String(query.pageSize))
  if (query.search?.trim()) p.set('search', query.search.trim())
  if (query.sortBy) p.set('sortBy', query.sortBy)
  if (query.sortDescending) p.set('sortDescending', 'true')
  if (query.type != null) p.set('type', String(query.type))
  return api.get<Paged<AccountListItem>>(`/preaccounting/accounts?${p.toString()}`)
}
/** Hafif cari listesi (dropdown'lar için). */
export function listAccountsLookup(type?: AccountType): Promise<ApiResult<AccountLookup[]>> {
  const q = type != null ? `?type=${type}` : ''
  return api.get<AccountLookup[]>(`/preaccounting/accounts/lookup${q}`)
}
export function getAccount(id: string): Promise<ApiResult<AccountDetail>> {
  return api.get<AccountDetail>(`/preaccounting/accounts/${id}`)
}
export function createAccount(payload: AccountPayload): Promise<ApiResult<string>> {
  return api.post<string>('/preaccounting/accounts', payload)
}
export function updateAccount(id: string, payload: AccountPayload): Promise<ApiResult> {
  return api.put(`/preaccounting/accounts/${id}`, payload)
}
export function deleteAccount(id: string): Promise<ApiResult> {
  return api.delete(`/preaccounting/accounts/${id}`)
}

/* ---- Hareketler ---- */

export function listTransactions(accountId: string, page = 1, pageSize = 50): Promise<ApiResult<Paged<Transaction>>> {
  return api.get<Paged<Transaction>>(`/preaccounting/accounts/${accountId}/transactions?page=${page}&pageSize=${pageSize}`)
}
export function createTransaction(accountId: string, payload: CreateTransactionPayload): Promise<ApiResult<string>> {
  return api.post<string>(`/preaccounting/accounts/${accountId}/transactions`, payload)
}
export function deleteTransaction(id: string): Promise<ApiResult> {
  return api.delete(`/preaccounting/transactions/${id}`)
}

/* ---- Yardımcı ---- */

const tl = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })

/** Tutarı ₺ olarak biçimlendirir. */
export function fmtMoney(amount: number): string {
  return tl.format(amount)
}

/** Bakiye etiketi: pozitif = Borç (cari borçlu), negatif = Alacak. */
export function balanceLabel(balance: number): string {
  if (balance > 0) return 'Borç'
  if (balance < 0) return 'Alacak'
  return '—'
}
