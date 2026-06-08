/** Önizleme tablosu kolonu (yalnız başlık + hizalama; veri yok). */
export interface PreviewColumn {
  header: string
  align?: 'left' | 'right' | 'center'
  width?: number
}

interface PreviewTableProps {
  columns: PreviewColumn[]
  /** İskelet satır sayısı. */
  rows?: number
}

/**
 * PreviewTable — gerçek tablo düzenini (kolon başlıkları) gösteren, satırları
 * shimmer iskelet olan önizleme tablosu. Mock veri yok; yalnızca yapı görünür.
 */
export function PreviewTable({ columns, rows = 6 }: PreviewTableProps) {
  return (
    <div className="fx-table-wrap">
      <table className="fx-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.header} style={{ textAlign: c.align, width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="fx-skeleton-row">
              {columns.map((c) => (
                <td key={c.header}>
                  <span
                    className="fx-skeleton"
                    style={c.align === 'right' ? { width: '55%', marginLeft: 'auto' } : undefined}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
