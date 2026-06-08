import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { FxIcon } from '../FxIcon'

export interface FxColumn<T> {
  key: string
  header: string
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  width?: string | number
  /** Sıralama/arama için ham değer. Verilmezse o kolon sıralanamaz/aranamaz. */
  accessor?: (row: T) => string | number
  /** Hücre içeriği. Verilmezse accessor değeri basılır. */
  render?: (row: T) => ReactNode
}

type SortDir = 'asc' | 'desc'

/** Server modunda tabloya verilecek sorgu (parent API'ye iletir). */
export interface FxServerQuery {
  page: number
  pageSize: number
  search: string
  sortBy: string | null
  sortDescending: boolean
}

/** Server-side mod yapılandırması. Verilirse FxTable filtre/sıralama/sayfalamayı API'ye delege eder. */
export interface FxTableServer {
  /** Toplam kayıt sayısı (tüm sayfalar). */
  totalCount: number
  /** Sorgu değiştiğinde (sayfa/boyut/arama/sıralama) çağrılır; parent veriyi çeker. */
  onQueryChange: (query: FxServerQuery) => void
  /** Yükleniyor göstergesi. */
  loading?: boolean
  /** Arama debounce süresi (ms). Varsayılan 350. */
  searchDebounceMs?: number
}

interface FxTableProps<T> {
  columns: FxColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  searchable?: boolean
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  emptyText?: string
  /** Client modunda yükleme durumu (veri gelene kadar skeleton gösterilir). Server modda `server.loading` kullanılır. */
  loading?: boolean
  /**
   * Verilirse tablo SERVER modunda çalışır: arama/sıralama/sayfalama API'ye gider
   * (`onQueryChange`), `data` o anki sayfanın satırlarıdır, `totalCount` sunucudan gelir.
   * Verilmezse tablo eskisi gibi tamamen client-side çalışır (geriye dönük uyumlu).
   */
  server?: FxTableServer
}

/**
 * FxTable — ortak tablo bileşeni. Header'a göre sıralama, tablo içi arama,
 * pagination ve sayfa başına kayıt (entity per page) yetenekleri yerleşik.
 * İki mod: client-side (varsayılan) veya server-side (`server` prop'u ile).
 */
export function FxTable<T>({
  columns,
  data,
  rowKey,
  searchable = true,
  searchPlaceholder = 'Tabloda ara…',
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyText = 'Kayıt bulunamadı.',
  loading: clientLoading,
  server,
}: FxTableProps<T>) {
  const isServer = !!server
  const serverRef = useRef(server)
  // Ref'i her commit'te tazele (render sırasında değil) — emit effect'i güncel server'ı görür.
  useEffect(() => {
    serverRef.current = server
  })

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [page, setPage] = useState(1)

  // Server: arama debounce → debouncedQuery + sayfayı başa al.
  useEffect(() => {
    if (!isServer) return
    const ms = serverRef.current?.searchDebounceMs ?? 350
    const t = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, ms)
    return () => clearTimeout(t)
  }, [query, isServer])

  // Server: sorgu parametreleri değişince parent'a haber ver (mount dahil → ilk yükleme).
  useEffect(() => {
    if (!isServer) return
    serverRef.current?.onQueryChange({
      page,
      pageSize,
      search: debouncedQuery,
      sortBy: sortKey,
      sortDescending: sortDir === 'desc',
    })
  }, [page, pageSize, sortKey, sortDir, debouncedQuery, isServer])

  const filtered = useMemo(() => {
    if (isServer) return data
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return data
    return data.filter((row) =>
      columns.some((col) => {
        if (!col.accessor) return false
        return String(col.accessor(row)).toLocaleLowerCase('tr').includes(q)
      }),
    )
  }, [data, columns, query, isServer])

  const sorted = useMemo(() => {
    if (isServer) return filtered
    if (!sortKey) return filtered
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.accessor) return filtered
    const accessor = col.accessor
    const copy = [...filtered]
    copy.sort((a, b) => {
      const va = accessor(a)
      const vb = accessor(b)
      let cmp: number
      if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
      else cmp = String(va).localeCompare(String(vb), 'tr')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, columns, sortKey, sortDir, isServer])

  const totalCount = isServer ? server!.totalCount : sorted.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const currentPage = isServer ? page : Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const pageRows = isServer ? data : sorted.slice(start, start + pageSize)
  const loading = isServer ? server!.loading === true : clientLoading === true
  const skeletonCount = Math.min(Math.max(pageSize, 1), 8)

  const onSort = (col: FxColumn<T>) => {
    if (!col.sortable || !col.accessor) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
    if (isServer) setPage(1)
  }

  const onSearch = (value: string) => {
    setQuery(value)
    if (!isServer) setPage(1)
  }

  const onPageSize = (value: number) => {
    setPageSize(value)
    setPage(1)
  }

  const rangeFrom = totalCount === 0 ? 0 : start + 1
  const rangeTo = isServer ? start + pageRows.length : Math.min(start + pageSize, totalCount)

  return (
    <div className="fx-table-comp">
      {searchable && (
        <div className="fx-table-toolbar">
          <div className="fx-table-search">
            <FxIcon name="search" size={16} />
            <input
              type="text"
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Tabloda ara"
            />
          </div>
          <div className="fx-table-count fx-text-muted">
            {loading ? 'Yükleniyor…' : `${totalCount} kayıt`}
          </div>
        </div>
      )}

      <div className="fx-table-wrap">
        <table className="fx-table">
          <thead>
            <tr>
              {columns.map((col) => {
                const isSorted = sortKey === col.key
                const sortable = col.sortable && col.accessor
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align ?? 'left' }}
                    className={sortable ? 'is-sortable' : ''}
                    onClick={() => onSort(col)}
                    aria-sort={isSorted ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="fx-th-inner">
                      {col.header}
                      {sortable && (
                        <span className={`fx-th-sort ${isSorted ? 'is-active' : ''}`}>
                          <FxIcon
                            name="chevron-down"
                            size={14}
                            style={{
                              transform: isSorted && sortDir === 'asc' ? 'rotate(180deg)' : undefined,
                            }}
                          />
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: skeletonCount }).map((_, i) => (
                <tr key={`sk-${i}`} className="fx-skeleton-row">
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      <span className="fx-skeleton" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="fx-table-empty fx-text-muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                          ? String(col.accessor(row))
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="fx-table-footer">
        <div className="fx-table-pagesize fx-text-muted">
          <span>Sayfa başına</span>
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Sayfa başına kayıt">
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="fx-table-pager">
          <span className="fx-text-muted">
            {rangeFrom}–{rangeTo} / {totalCount}
          </span>
          <button
            type="button"
            className="fx-icon-btn fx-icon-btn--sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label="Önceki sayfa"
          >
            <FxIcon name="chevron-down" size={16} style={{ transform: 'rotate(90deg)' }} />
          </button>
          <span className="fx-table-pageinfo">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="fx-icon-btn fx-icon-btn--sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Sonraki sayfa"
          >
            <FxIcon name="chevron-down" size={16} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
