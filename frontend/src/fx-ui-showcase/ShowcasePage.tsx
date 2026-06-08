import { useState, type ReactNode } from 'react'
import {
  FxCard,
  FxButton,
  FxBadge,
  FxCopyButton,
  FxAvatar,
  FxStatCard,
  FxIcon,
  FxTable,
  FxInput,
  FxTextarea,
  FxSelect,
  FxCheckbox,
  FxDatePicker,
  FxFormError,
  FxModal,
  FX_ICON_NAMES,
  useToast,
  type FxColumn,
} from '../fx-ui'

/* ---- FxTable demo verisi ---- */
interface DemoPerson {
  id: number
  name: string
  role: string
  city: string
  active: boolean
}
const DEMO_PEOPLE: DemoPerson[] = [
  { id: 1, name: 'Ahmet Yılmaz', role: 'Saha Sorumlusu', city: 'Kocaeli', active: true },
  { id: 2, name: 'Zeynep Kaya', role: 'Lojistik', city: 'İzmit', active: true },
  { id: 3, name: 'Mehmet Demir', role: 'Şoför', city: 'Sakarya', active: false },
  { id: 4, name: 'Elif Şahin', role: 'Muhasebe', city: 'Gebze', active: true },
  { id: 5, name: 'Can Öztürk', role: 'Depo', city: 'Kocaeli', active: true },
  { id: 6, name: 'Derya Aydın', role: 'Saha', city: 'İzmit', active: false },
  { id: 7, name: 'Burak Çelik', role: 'Şoför', city: 'Sakarya', active: true },
]

const PEOPLE_COLUMNS: FxColumn<DemoPerson>[] = [
  { key: 'name', header: 'Ad Soyad', sortable: true, accessor: (r) => r.name, render: (r) => <strong>{r.name}</strong> },
  { key: 'role', header: 'Görev', sortable: true, accessor: (r) => r.role },
  { key: 'city', header: 'Şehir', sortable: true, accessor: (r) => r.city },
  {
    key: 'active',
    header: 'Durum',
    sortable: true,
    accessor: (r) => (r.active ? 1 : 0),
    render: (r) => <FxBadge tone={r.active ? 'success' : 'neutral'}>{r.active ? 'Aktif' : 'Pasif'}</FxBadge>,
  },
]

/* ---- fx- utility class referansı ---- */
const FX_CLASSES: { cls: string; effect: string }[] = [
  { cls: 'fx-flex', effect: 'display: flex' },
  { cls: 'fx-inline-flex', effect: 'display: inline-flex' },
  { cls: 'fx-flex-col', effect: 'flex-direction: column' },
  { cls: 'fx-items-center', effect: 'align-items: center' },
  { cls: 'fx-justify-center', effect: 'justify-content: center' },
  { cls: 'fx-justify-between', effect: 'justify-content: space-between' },
  { cls: 'fx-gap-2', effect: 'gap: 8px' },
  { cls: 'fx-gap-4', effect: 'gap: 16px' },
  { cls: 'fx-full', effect: 'width/height: 100%' },
  { cls: 'fx-text-muted', effect: 'color: ikincil metin' },
  { cls: 'fx-text-brand', effect: 'color: marka rengi' },
]

function Section({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <div className="fx-showcase-section">
      <div className="fx-showcase-section__title">{title}</div>
      <div className="fx-showcase-section__desc">{desc}</div>
      <FxCard>{children}</FxCard>
    </div>
  )
}

/**
 * ShowcasePage (fx-debug) — fx-ui bileşen kütüphanesinin canlı kataloğu.
 * Her component ne işe yarar, hangi varyantları var ve fx- class'ları neyi yapar:
 * ekipteki geliştiriciler için tek referans noktası.
 */
const CITY_OPTIONS = [
  { value: 'kocaeli', label: 'Kocaeli' },
  { value: 'izmit', label: 'İzmit' },
  { value: 'sakarya', label: 'Sakarya' },
  { value: 'gebze', label: 'Gebze' },
]

export function ShowcasePage() {
  const toast = useToast()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [city, setCity] = useState('')
  const [agree, setAgree] = useState(false)
  const [date, setDate] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <div className="fx-page-head">
        <div className="fx-flex fx-items-center fx-gap-2">
          <div className="fx-page-head__title">fx-debug · Bileşen Kütüphanesi</div>
          <FxBadge tone="brand">fx-ui</FxBadge>
        </div>
        <div className="fx-page-head__sub">
          Kendi component kütüphanemizin canlı kataloğu — sıfır dış bağımlılık, tema-duyarlı.
        </div>
      </div>

      <Section title="FxButton" desc="Aksiyon butonu. variant: primary | subtle | ghost | danger · size: sm | md">
        <div className="fx-demo-row">
          <FxButton variant="primary">Primary</FxButton>
          <FxButton variant="subtle">Subtle</FxButton>
          <FxButton variant="ghost">Ghost</FxButton>
          <FxButton variant="danger">Danger</FxButton>
          <FxButton variant="primary" size="sm">Küçük</FxButton>
          <FxButton variant="subtle" disabled>Pasif</FxButton>
          <FxButton variant="primary"><FxIcon name="package" size={16} /> İkonlu</FxButton>
        </div>
      </Section>

      <Section title="FxBadge" desc="Durum/etiket rozeti. tone: brand | neutral | success | danger | warning | info">
        <div className="fx-demo-row">
          <FxBadge tone="brand">Marka</FxBadge>
          <FxBadge tone="neutral">Nötr</FxBadge>
          <FxBadge tone="success">Başarılı</FxBadge>
          <FxBadge tone="danger">Hata</FxBadge>
          <FxBadge tone="warning">Uyarı</FxBadge>
          <FxBadge tone="info">Bilgi</FxBadge>
        </div>
      </Section>

      <Section title="FxAvatar" desc="İsimden baş harf üreten avatar. size prop ile ölçeklenir.">
        <div className="fx-demo-row">
          <FxAvatar name="Berkay Yıldırım" size={28} />
          <FxAvatar name="Ahmet Yılmaz" size={36} />
          <FxAvatar name="Zeynep Kaya" size={48} />
          <FxAvatar name="Formex" size={56} />
        </div>
      </Section>

      <Section
        title="FxCopyButton"
        desc="Bir değeri panoya kopyalar, kısa süre ✓ onayı gösterir. Detay view'larında alan değerinin yanında kullanılır (fx-detail-item içinde hover'da belirir)."
      >
        <div className="fx-demo-row">
          <span>1234567890</span>
          <FxCopyButton value="1234567890" />
          <span>ornek@formex.com</span>
          <FxCopyButton value="ornek@formex.com" onCopied={() => toast.success('Panoya kopyalandı.')} />
        </div>
        <div className="fx-detail-grid" style={{ marginTop: 16 }}>
          <div className="fx-detail-item">
            <div className="fx-detail-item__label">Vergi No (detay örneği)</div>
            <div className="fx-detail-item__value fx-detail-item__value--copyable">
              <span>1234567890</span>
              <FxCopyButton value="1234567890" title="Vergi No kopyala" />
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Form bileşenleri"
        desc="FxInput · FxSelect · FxTextarea · FxDatePicker · FxCheckbox — hepsi label, zorunlu (*) ve hata/hint destekli."
      >
        <div className="fx-grid fx-grid--form">
          <FxInput
            label="Ad Soyad"
            required
            placeholder="Örn. Berkay Yıldırım"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hint="Görünen ad olarak kullanılır."
          />
          <FxInput
            label="E-posta"
            type="email"
            placeholder="ornek@formex.com"
            leftAdornment={<FxIcon name="mail" size={16} />}
            error={name.trim() === '' ? undefined : 'Örnek hata: bu e-posta zaten kayıtlı.'}
          />
          <FxSelect
            label="Şehir"
            required
            placeholder="Seçiniz…"
            options={CITY_OPTIONS}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <FxDatePicker
            label="Başlangıç tarihi"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            hint="YYYY-AA-GG"
          />
          <FxTextarea
            label="Not"
            placeholder="Serbest açıklama…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="fx-grid__full"
          />
        </div>
        <div className="fx-demo-row" style={{ marginTop: 14 }}>
          <FxCheckbox
            label="Şartları ve gizlilik politikasını kabul ediyorum"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
          />
          <FxCheckbox label="Pasif örnek" checked disabled />
        </div>
      </Section>

      <Section
        title="FxFormError"
        desc="Form/diyalog hata özeti: kalın başlık + madde listesi. Hata yoksa hiçbir şey render etmez."
      >
        <div className="fx-grid fx-grid--form">
          <FxFormError
            title="Eksik veya hatalı alanlar"
            errors={['Ad zorunludur.', 'Soyad zorunludur.', 'T.C. Kimlik No yalnızca rakamlardan oluşmalıdır.']}
          />
          <FxFormError message="Sunucuya ulaşılamadı." />
        </div>
      </Section>

      <Section title="FxModal" desc="Portal tabanlı diyalog. Esc / arka plan tıkı ile kapanır, body scroll kilitlenir. size: sm | md | lg">
        <div className="fx-demo-row">
          <FxButton variant="primary" onClick={() => setModalOpen(true)}>
            <FxIcon name="grid" size={16} /> Modalı aç
          </FxButton>
        </div>
        <FxModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Örnek Diyalog"
          size="md"
          footer={
            <>
              <FxButton variant="ghost" onClick={() => setModalOpen(false)}>İptal</FxButton>
              <FxButton
                variant="primary"
                onClick={() => {
                  setModalOpen(false)
                  toast.success('Modal onaylandı.')
                }}
              >
                Kaydet
              </FxButton>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            Bu bir FxModal örneğidir. İçine herhangi bir içerik (form, metin, tablo) koyabilirsin.
          </p>
          <FxInput label="Hızlı not" placeholder="Bir şeyler yaz…" />
        </FxModal>
      </Section>

      <Section title="FxToast" desc="Kendi bildirim altyapımız (useToast). 4 tür, otomatik kapanma, sağ üstte yığılır.">
        <div className="fx-demo-row">
          <FxButton variant="subtle" onClick={() => toast.success('İşlem başarıyla tamamlandı.', { title: 'Başarılı' })}>success</FxButton>
          <FxButton variant="subtle" onClick={() => toast.error('Bir hata oluştu.', { title: 'Hata' })}>error</FxButton>
          <FxButton variant="subtle" onClick={() => toast.warning('Dikkat: süre doluyor.')}>warning</FxButton>
          <FxButton variant="subtle" onClick={() => toast.info('Bilgilendirme mesajı.')}>info</FxButton>
        </div>
      </Section>

      <Section title="FxStatCard" desc="Dashboard istatistik kutucuğu. icon, label, value, hint, trend.">
        <div className="fx-grid fx-grid--stats">
          <FxStatCard icon="package" label="Toplam" value="1.284" trend={{ value: '%8', positive: true }} />
          <FxStatCard icon="truck" label="Sevkiyat" value="37" hint="14 yolda" />
          <FxStatCard icon="file-text" label="Belge" value="12" trend={{ value: '%3', positive: false }} />
          <FxStatCard icon="users" label="Personel" value="58" />
        </div>
      </Section>

      <Section title="FxTable" desc="Ortak tablo: header sıralama, tablo içi arama, pagination ve sayfa başına kayıt yerleşik.">
        <FxTable columns={PEOPLE_COLUMNS} data={DEMO_PEOPLE} rowKey={(r) => r.id} pageSize={5} pageSizeOptions={[5, 10, 25]} />
      </Section>

      <Section title="FxIcon" desc={`Inline SVG ikon seti (${FX_ICON_NAMES.length} ikon), currentColor. <FxIcon name="..." />`}>
        <div className="fx-icons-grid">
          {FX_ICON_NAMES.map((name) => (
            <div key={name} className="fx-icon-cell">
              <FxIcon name={name} size={22} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="fx- utility class'ları" desc="Layout için sık kullanılan yardımcı sınıflar (fx- prefix konvansiyonu).">
        <div className="fx-table-wrap fx-class-table">
          <table className="fx-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Karşılığı</th>
              </tr>
            </thead>
            <tbody>
              {FX_CLASSES.map((row) => (
                <tr key={row.cls}>
                  <td><code>{row.cls}</code></td>
                  <td className="fx-text-muted">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
