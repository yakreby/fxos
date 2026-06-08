import { api, type ApiResult } from '../../core/api/client'

export interface LogEntry {
  id: number
  timeStamp: string
  level: string
  message: string | null
  exception: string | null
  properties: string | null
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

export interface LogFilter {
  page: number
  pageSize: number
  level?: string
  search?: string
  /** "YYYY-MM-DD" (dahil) */
  from?: string
  /** "YYYY-MM-DD" (dahil; gün sonuna kadar) */
  to?: string
}

export function listLogs(filter: LogFilter): Promise<ApiResult<Paged<LogEntry>>> {
  const p = new URLSearchParams()
  p.set('page', String(filter.page))
  p.set('pageSize', String(filter.pageSize))
  if (filter.level) p.set('level', filter.level)
  if (filter.search?.trim()) p.set('search', filter.search.trim())
  if (filter.from) p.set('from', `${filter.from}T00:00:00`)
  if (filter.to) p.set('to', `${filter.to}T23:59:59`)
  return api.get<Paged<LogEntry>>(`/logs?${p.toString()}`)
}

export function getLogLevels(): Promise<ApiResult<string[]>> {
  return api.get<string[]>('/logs/levels')
}
