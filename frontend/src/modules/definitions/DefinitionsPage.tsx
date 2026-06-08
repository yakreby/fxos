import { useEffect, useState } from 'react'
import { FxBadge, FxIcon } from '../../fx-ui'
import { DefinitionTab } from './DefinitionTab'
import { listDefinitionTypes, type DefinitionTypeOption } from './definitions-api'

/**
 * Tanımlamalar modülü — sistem geneli tek tablolu lookup yönetimi (atık lokasyonu/tipi,
 * iade/atık/işlem/ürün grupları). Tür başına sekme; her sekme kendi verisini yükler.
 * Diğer modüller bu tanımlara FK ile bağlanır.
 */
export function DefinitionsPage() {
  const [types, setTypes] = useState<DefinitionTypeOption[]>([])
  const [active, setActive] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await listDefinitionTypes()
      if (!cancelled && res.succeeded && res.data) {
        setTypes(res.data)
        if (res.data.length) setActive(res.data[0].value)
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const activeType = types.find((t) => t.value === active)

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Tanımlamalar</div>
          <FxBadge tone="brand">Yönetim</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Sistem geneli tanım listeleri (lookup). Diğer modüller (Ürünler, Sayım, Sevkiyat) bu tanımlara bağlanır.
        </div>
      </div>

      {loading ? (
        <div className="fx-text-muted" style={{ padding: 24 }}>Yükleniyor…</div>
      ) : (
        <>
          <div className="fx-tabs">
            {types.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`fx-tab ${active === t.value ? 'is-active' : ''}`}
                onClick={() => setActive(t.value)}
              >
                <FxIcon name="settings" size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="fx-tab-panel">
            {activeType && (
              <DefinitionTab key={activeType.value} type={activeType.value} typeLabel={activeType.label} />
            )}
          </div>
        </>
      )}
    </>
  )
}
