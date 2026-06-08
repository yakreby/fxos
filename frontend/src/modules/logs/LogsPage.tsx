import { useCallback, useEffect, useState } from 'react'
import { FxBadge, FxButton, FxIcon, FxInput, FxSelect, FxDatePicker, FxModal } from '../../fx-ui'
import { listLogs, getLogLevels, type LogEntry, type LogFilter, type Paged } from './logs-api'

const PAGE_SIZES = [25, 50, 100]

const levelTone = (level: string): 'warning' | 'danger' =>
  level === 'Warning' ? 'warning' : 'danger'

const fmtTs = (iso: string): string => iso.replace('T', ' ').slice(0, 19)

/** Loglar — Serilog "Logs" tablosunun (Warning+) sunucu taraflı görüntüleyicisi. */
export function LogsPage() {
  // Düzenlenen filtre girdileri
  const [level, setLevel] = useState('')
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Uygulanan sorgu (fetch bunu izler)
  const [query, setQuery] = useState<LogFilter>({ page: 1, pageSize: 50 })
  const [data, setData] = useState<Paged<LogEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState<string[]>(['Warning', 'Error', 'Fatal'])
  const [selected, setSelected] = useState<LogEntry | null>(null)

  useEffect(() => {
    void getLogLevels().then((r) => {
      if (r.succeeded && r.data?.length) setLevels(r.data)
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await listLogs(query)
    if (res.succeeded && res.data) setData(res.data)
    setLoading(false)
  }, [query])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const applyFilters = () =>
    setQuery({
      page: 1,
      pageSize: query.pageSize,
      level: level || undefined,
      search: search || undefined,
      from: from || undefined,
      to: to || undefined,
    })

  const resetFilters = () => {
    setLevel('')
    setSearch('')
    setFrom('')
    setTo('')
    setQuery({ page: 1, pageSize: query.pageSize })
  }

  const levelOptions = [
    { value: '', label: 'Tüm seviyeler' },
    ...levels.map((l) => ({ value: l, label: l })),
  ]

  const totalPages = data?.totalPages ?? 1
  const page = data?.page ?? 1

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Sistem Kayıtları · Loglar</div>
          <FxBadge tone="brand">Sistem</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Sistem ve işlem logları (Serilog · Warning ve üzeri). Seviye, tarih ve metne göre filtreleyin.
        </div>
      </div>

      {/* Filtre çubuğu */}
      <div className="fx-grid fx-grid--form" style={{ marginBottom: 14 }}>
        <FxSelect label="Seviye" options={levelOptions} value={level} onChange={(e) => setLevel(e.target.value)} />
        <FxInput
          label="Ara (mesaj)"
          placeholder="Metin…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applyFilters()
          }}
        />
        <FxDatePicker label="Başlangıç" value={from} onChange={(e) => setFrom(e.target.value)} />
        <FxDatePicker label="Bitiş" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="fx-demo-row" style={{ marginBottom: 14, gap: 8 }}>
        <FxButton variant="primary" onClick={applyFilters}>
          <FxIcon name="search" size={16} /> Filtrele
        </FxButton>
        <FxButton variant="ghost" onClick={resetFilters}>Sıfırla</FxButton>
        <FxButton variant="subtle" onClick={() => void load()}>
          <FxIcon name="activity" size={16} /> Yenile
        </FxButton>
      </div>

      {/* Tablo */}
      <div className="fx-table-comp">
        <div className="fx-table-toolbar">
          <div className="fx-table-count fx-text-muted">
            {loading ? 'Yükleniyor…' : `${data?.totalCount ?? 0} kayıt`}
          </div>
        </div>

        <div className="fx-table-wrap">
          <table className="fx-table">
            <thead>
              <tr>
                <th style={{ width: 170 }}>Zaman</th>
                <th style={{ width: 90 }}>Seviye</th>
                <th>Mesaj</th>
                <th style={{ width: 90, textAlign: 'right' }}></th>
              </tr>
            </thead>
            <tbody>
              {!data || data.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="fx-table-empty fx-text-muted">
                    {loading ? 'Yükleniyor…' : 'Kayıt bulunamadı.'}
                  </td>
                </tr>
              ) : (
                data.items.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{fmtTs(log.timeStamp)}</td>
                    <td><FxBadge tone={levelTone(log.level)}>{log.level}</FxBadge></td>
                    <td style={{ maxWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.message}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <FxButton variant="subtle" size="sm" onClick={() => setSelected(log)}>
                        Detay
                      </FxButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div className="fx-table-footer">
          <div className="fx-table-pagesize fx-text-muted">
            <span>Sayfa başına</span>
            <select
              value={query.pageSize}
              onChange={(e) => setQuery((q) => ({ ...q, page: 1, pageSize: Number(e.target.value) }))}
              aria-label="Sayfa başına kayıt"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="fx-table-pager">
            <button
              type="button"
              className="fx-icon-btn fx-icon-btn--sm"
              disabled={!data?.hasPrevious}
              onClick={() => setQuery((q) => ({ ...q, page: Math.max(1, q.page - 1) }))}
              aria-label="Önceki sayfa"
            >
              <FxIcon name="chevron-down" size={16} style={{ transform: 'rotate(90deg)' }} />
            </button>
            <span className="fx-table-pageinfo">{page} / {totalPages}</span>
            <button
              type="button"
              className="fx-icon-btn fx-icon-btn--sm"
              disabled={!data?.hasNext}
              onClick={() => setQuery((q) => ({ ...q, page: q.page + 1 }))}
              aria-label="Sonraki sayfa"
            >
              <FxIcon name="chevron-down" size={16} style={{ transform: 'rotate(-90deg)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Detay */}
      <FxModal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="Log Detayı"
        size="lg"
        footer={<FxButton variant="primary" onClick={() => setSelected(null)}>Kapat</FxButton>}
      >
        {selected && (
          <div className="fx-detail-grid" style={{ marginBottom: 14 }}>
            <div className="fx-detail-item">
              <div className="fx-detail-item__label">Zaman</div>
              <div className="fx-detail-item__value">{fmtTs(selected.timeStamp)}</div>
            </div>
            <div className="fx-detail-item">
              <div className="fx-detail-item__label">Seviye</div>
              <div className="fx-detail-item__value"><FxBadge tone={levelTone(selected.level)}>{selected.level}</FxBadge></div>
            </div>
          </div>
        )}
        {selected && (
          <>
            <div className="fx-detail-item__label">Mesaj</div>
            <div className="fx-detail-item__value" style={{ marginBottom: 14, whiteSpace: 'pre-wrap' }}>{selected.message}</div>

            {selected.exception && (
              <>
                <div className="fx-detail-item__label">İstisna</div>
                <pre className="fx-log-pre">{selected.exception}</pre>
              </>
            )}
            {selected.properties && (
              <>
                <div className="fx-detail-item__label">Özellikler</div>
                <pre className="fx-log-pre">{selected.properties}</pre>
              </>
            )}
          </>
        )}
      </FxModal>
    </>
  )
}
