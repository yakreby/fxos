import { useCallback, useEffect, useState } from 'react'
import { FxBadge, FxButton, FxIcon, FxSelect, FxTable, type FxColumn, type FxSelectOption } from '../../fx-ui'
import { listShelves, listStock, fmtNum, fmtKg, type Shelf, type StockItem } from './stock-api'

/** Stok Listesi — ürün bazında eldeki stok (hareketlerden hesaplanır). Rafa göre filtrelenebilir. */
export function StockPage() {
  const [items, setItems] = useState<StockItem[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [shelfId, setShelfId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void listShelves().then((res) => {
      if (res.succeeded && res.data) setShelves(res.data)
    })
  }, [])

  const load = useCallback(async (shelf: string) => {
    setLoading(true)
    const res = await listStock(shelf || undefined)
    if (res.succeeded && res.data) setItems(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(shelfId)
  }, [load, shelfId])

  const columns: FxColumn<StockItem>[] = [
    { key: 'productCode', header: 'Kod', width: 140, sortable: true, accessor: (s) => s.productCode, render: (s) => <strong>{s.productCode}</strong> },
    { key: 'productName', header: 'Ürün', sortable: true, accessor: (s) => s.productName },
    { key: 'quantityOnHand', header: 'Eldeki Miktar', align: 'right', sortable: true, accessor: (s) => s.quantityOnHand, render: (s) => fmtNum(s.quantityOnHand) },
    { key: 'weightOnHand', header: 'Eldeki Ağırlık', align: 'right', sortable: true, accessor: (s) => s.weightOnHand, render: (s) => fmtKg(s.weightOnHand) },
  ]

  const shelfOptions: FxSelectOption[] = shelves.map((s) => ({ value: s.id, label: `${s.code} · ${s.name}` }))

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">Stok Listesi</div>
          <FxBadge tone="brand">Operasyon</FxBadge>
        </div>
        <div className="fx-page-head__sub">Eldeki stok ürün bazında — stok hareketlerinden hesaplanır (Σ giriş − Σ çıkış).</div>
      </div>

      <div className="fx-flex fx-items-center fx-gap-4" style={{ marginBottom: 14, maxWidth: 420 }}>
        <FxSelect
          label="Raf filtresi"
          placeholder="Tüm raflar"
          options={shelfOptions}
          value={shelfId}
          onChange={(e) => setShelfId(e.target.value)}
          className="fx-full"
        />
        {shelfId && (
          <FxButton variant="ghost" size="sm" onClick={() => setShelfId('')} style={{ marginTop: 22 }}>
            <FxIcon name="x" size={15} /> Temizle
          </FxButton>
        )}
      </div>

      <FxTable
        columns={columns}
        data={items}
        rowKey={(s) => s.productId}
        pageSize={15}
        loading={loading}
        searchPlaceholder="Ürün kodu/adı ara…"
        emptyText="Stokta ürün yok."
      />
    </>
  )
}
