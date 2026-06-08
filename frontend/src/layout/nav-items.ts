import type { FxIconName } from '../fx-ui'

export interface NavItem {
  key: string
  label: string
  icon: FxIconName
  /** Henüz inşa edilmedi — sidebar'da "Yakında" rozetiyle işaretlenir. */
  soon?: boolean
  /** Placeholder sayfada gösterilecek kısa açıklama (modülün ne işe yaradığı). */
  description?: string
  /** Placeholder sayfada listelenecek planlanan özellikler. */
  planned?: string[]
  /** Alt menü (dropdown). Varsa öğenin kendi sayfası yoktur; tıklayınca açılır. */
  children?: NavItem[]
  /** Bu öğeyi görmek için gereken izin. Yoksa herkese görünür. */
  permission?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

/**
 * Sidebar navigasyonu — operasyon-merkezli düzen (eski sistemin üst menü yapısına uyumlu).
 * Modüller backend ile birebir eşleşir. Henüz inşa edilmemiş modüller `soon` + ModuleShell.
 * Açıklamalar/planned alanları her sayfanın "ne ile ilgili olduğunu" anlatan nottur.
 * Detaylı mimari/API planı: docs/MODULES.md.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Genel',
    items: [{ key: 'dashboard', label: 'Genel Bakış', icon: 'grid' }],
  },
  {
    title: 'Operasyon',
    items: [
      {
        key: 'facility',
        label: 'Tesis Yönetimi',
        icon: 'grid',
        children: [
          { key: 'facility-dashboard', label: 'Tesis Paneli', icon: 'grid', soon: true, description: 'Tesisin anlık durumu: stok, mal kabul, çıkış ve doluluk özetleri.', planned: ['Özet kartları', 'Günlük giriş/çıkış', 'Doluluk göstergeleri'] },
          { key: 'goods-receipt', label: 'Mal Kabul', icon: 'package', description: 'Gelen ürünlerin tesise kabulü: fiş + satırlar (ürün/miktar/tartım), tedarikçi cari. Stok girişi/adresleme ileride.', permission: 'goodsreceipts.view' },
          { key: 'outbound', label: 'Çıkışlar', icon: 'truck', soon: true, description: 'Tesisten ürün çıkışları ve sevk hazırlığı.', planned: ['Çıkış fişi', 'Sevkiyata bağlama', 'Stok düşümü'] },
          { key: 'stock', label: 'Stok Listesi', icon: 'grid', description: 'Ürün bazında eldeki stok (hareketlerden hesaplanır). Rafa göre filtre.', permission: 'stock.view' },
          { key: 'shelves', label: 'Raflar', icon: 'grid', description: 'Raf/lokasyon tanımları ve doluluk (miktar/KG/ürün çeşidi).', permission: 'shelves.view' },
          { key: 'movements', label: 'Hareket Detayı', icon: 'activity', description: 'Tüm stok hareketleri (giriş/çıkış/transfer/düzeltme/sayım) + transfer.', permission: 'stock.view' },
          { key: 'octabin', label: 'Octabin Yönetimi', icon: 'package', description: 'Octabin (büyük konteyner) takibi: açma, doldurma, kapatma ve sevk. İçerik esnek (atık tipi/ürün/serbest), doluluk takibi.', permission: 'octabins.view' },
          { key: 'separation', label: 'Separasyon', icon: 'grid', description: 'Ayrıştırma talepleri ve durum akışı (geri kazanım/imha). İşlem personele damgalanır (performans).', permission: 'separations.view' },
          { key: 'appointments', label: 'Randevular', icon: 'calendar', soon: true, description: 'Tedarikçi/araç randevu planlaması ve takvimi.', planned: ['Randevu oluştur', 'Takvim görünümü', 'Onay/durum'] },
        ],
      },
      {
        key: 'shipment',
        label: 'Sevkiyat & Lojistik',
        icon: 'truck',
        children: [
          { key: 'shipment-planning', label: 'Sevkiyat Planlama', icon: 'truck', soon: true, description: 'Sevkiyatların planlanması ve oluşturulması.', planned: ['Sevkiyat oluştur', 'Araç/rota atama', 'Yük planı'] },
          { key: 'shipment-requests', label: 'Talepler', icon: 'file-text', soon: true, description: 'Yeni sevkiyat/lojistik talepleri ve onayları.', planned: ['Yeni talep', 'Onay akışı', 'Talep listesi'] },
          { key: 'route-planning', label: 'Rota Planlama', icon: 'map-pin', soon: true, description: 'Araç rotalarının planlanması (rut planlaması).', planned: ['Rota oluştur', 'Nokta sıralama', 'Harita (ileride)'] },
          { key: 'routes', label: 'Rota Listesi', icon: 'package', soon: true, description: 'Planlanmış rotalar, durumları ve takibi.', planned: ['Rota listesi', 'Durum', 'Maliyet özeti'] },
          { key: 'logistics-movements', label: 'Lojistik Hareketleri', icon: 'activity', soon: true, description: 'Araç/sürücü bazlı lojistik hareket kayıtları.', planned: ['Hareket kayıtları', 'Araç/sürücü filtresi'] },
          { key: 'dispatch', label: 'İrsaliyeler', icon: 'file-text', soon: true, description: 'İrsaliye oluşturma, durum akışı, PDF ve karşılaştırma.', planned: ['İrsaliye oluştur', 'Durum (yolda/teslim)', 'PDF', 'Univera karşılaştırma'] },
          { key: 'locations', label: 'Lokasyonlar / Noktalar', icon: 'map-pin', soon: true, description: 'Toplama noktaları ve tesis lokasyonlarının yönetimi.', planned: ['Nokta kayıtları', 'Bölge/il filtresi', 'Harita (ileride)'] },
          { key: 'vehicles', label: 'Araç & Sürücüler', icon: 'truck', soon: true, description: 'Araç filosu ve sürücü atamaları (sürücü = Personel).', planned: ['Araç kartı', 'Sürücü atama', 'Bakım takibi'] },
        ],
      },
      {
        key: 'counting',
        label: 'Sayım & Saha',
        icon: 'activity',
        children: [
          { key: 'count-dashboard', label: 'Sayım Paneli', icon: 'grid', soon: true, description: 'Saha sayımlarının özet panosu.', planned: ['Sayım özetleri', 'Tamamlanma oranları'] },
          { key: 'counts', label: 'Sayımlar', icon: 'activity', soon: true, description: 'Sayım listesi, oluşturma ve takip (yönetici modu dahil).', planned: ['Sayım listesi', 'Yeni sayım', 'Sayım güncelleme'] },
          { key: 'field-photos', label: 'Saha Fotoğrafları', icon: 'file-text', soon: true, description: 'Sayım/saha fotoğraf arşivi ve görüntüleme.', planned: ['Fotoğraf arşivi', 'Noktaya göre filtre'] },
          { key: 'panorama', label: 'Panorama', icon: 'map-pin', soon: true, description: 'Nokta panorama görüntüleri.', planned: ['Panorama görüntüleyici', 'Nokta eşleştirme'] },
          { key: 'point-reports', label: 'Nokta & Zincir Raporları', icon: 'activity', soon: true, description: 'Nokta ve zincir bazlı sayım raporları.', planned: ['Nokta raporu', 'Zincir raporu', 'Dışa aktarma'] },
        ],
      },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      {
        key: 'products-defs',
        label: 'Ürün & Tanımlar',
        icon: 'package',
        children: [
          { key: 'products', label: 'Ürünler', icon: 'package', description: 'Ürün kartları: kod/barkod, müşteri (cari), gramaj, ambalaj, ürün/iade/atık grubu + işlem türü (Tanımlamalar FK).', permission: 'products.view' },
          { key: 'definitions', label: 'Tanımlamalar', icon: 'settings', description: 'Sistem geneli tanım/lookup yönetimi (atık lokasyonu/tipi, iade/atık/işlem/ürün grupları). Diğer modüller FK ile bağlanır.', permission: 'definitions.view' },
          { key: 'haccp', label: 'HACCP', icon: 'shield', soon: true, description: 'Gıda güvenliği (HACCP) süreç, kontrol ve kayıtları.', planned: ['Kontrol noktaları', 'Kayıtlar', 'Uygunsuzluk takibi'] },
        ],
      },
      {
        key: 'hr',
        label: 'İnsan Kaynakları',
        icon: 'users',
        children: [
          { key: 'personnel', label: 'Personel', icon: 'users', description: 'Personel kayıtları, kadro, departman ve özlük belgeleri.', permission: 'personnel.view' },
          { key: 'leave', label: 'İzin Yönetimi', icon: 'calendar', soon: true, description: 'Personel izin talepleri, onayları ve bakiyeleri.', planned: ['İzin talebi', 'Onay akışı', 'İzin bakiyesi'] },
          { key: 'work-report', label: 'Çalışma Raporu', icon: 'activity', soon: true, description: 'Personel çalışma/mesai raporları.', planned: ['Mesai kaydı', 'Dönem raporu', 'Dışa aktarma'] },
        ],
      },
      {
        key: 'accounting',
        label: 'Muhasebe',
        icon: 'credit-card',
        children: [
          { key: 'pre-accounting', label: 'Cari Hesaplar', icon: 'credit-card', description: 'Cari hesaplar, bakiyeler ve tahsilat/ödeme hareketleri.', permission: 'preaccounting.view' },
          { key: 'expenses', label: 'Masraf Yönetimi', icon: 'credit-card', soon: true, description: 'Masraf kayıtları, kategorileri ve takibi.', planned: ['Masraf kaydı', 'Kategori', 'Onay/rapor'] },
          { key: 'personnel-expenses', label: 'Personel Masrafları', icon: 'credit-card', soon: true, description: 'Personel bazlı masraf/avans takibi.', planned: ['Personel masrafı', 'Avans', 'Mahsup'] },
        ],
      },
      {
        key: 'documents',
        label: 'Belgeler',
        icon: 'file-text',
        children: [
          { key: 'document-list', label: 'Belgeler', icon: 'file-text', soon: true, description: 'Belge yükleme, kategori ve etiket yönetimi (genel arşiv).', planned: ['Belge yükleme', 'Kategori & etiket', 'Önizleme'], permission: 'documents.view' },
          { key: 'document-reminders', label: 'Hatırlatmalar', icon: 'bell', soon: true, description: 'Belge son kullanma/yenileme hatırlatmaları → bildirim.', planned: ['Hatırlatma kuralı', 'Süre dolum uyarıları', 'Bildirim entegrasyonu'], permission: 'documents.view' },
        ],
      },
    ],
  },
  {
    title: 'Sistem',
    items: [
      { key: 'reports', label: 'Rapor Merkezi', icon: 'activity', soon: true, description: 'Modüller arası rapor ve dışa aktarma merkezi.', planned: ['Rapor şablonları', 'Excel/PDF dışa aktarma', 'Zamanlanmış rapor'] },
      { key: 'notifications', label: 'Bildirimler', icon: 'bell', description: 'Kalıcı kullanıcı bildirimleri ve okundu takibi.' },
      {
        key: 'comm',
        label: 'İletişim',
        icon: 'message-square',
        children: [
          { key: 'sms', label: 'SMS (NetGSM)', icon: 'message-square', soon: true, description: 'NetGSM üzerinden SMS gönderimi ve şablonları.', planned: ['Tekil & toplu gönderim', 'Şablonlar', 'Gönderim geçmişi', 'Teslim durumu'] },
          { key: 'mail', label: 'E-posta', icon: 'mail', soon: true, description: 'E-posta gönderimi ve şablon yönetimi.', planned: ['SMTP gönderim', 'HTML şablonlar', 'Gönderim kuyruğu', 'Geçmiş'] },
        ],
      },
      { key: 'logs', label: 'Loglar', icon: 'activity', description: 'Sistem ve işlem loglarının izlenmesi (Serilog · Warning+).', permission: 'logs.view' },
      { key: 'access', label: 'Roller & İzinler', icon: 'shield', description: 'Kullanıcı, rol ve izin matrisi yönetimi.', permission: 'users.view' },
    ],
  },
]

/** Verilen key'e karşılık gelen nav öğesini döndürür (alt menüler dahil). */
export function findNavItem(key: string): NavItem | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.key === key) return item
      const child = item.children?.find((c) => c.key === key)
      if (child) return child
    }
  }
  return undefined
}

/**
 * Kullanıcının izinlerine göre görünür nav bölümlerini döndürür.
 * - İzinsiz (permission tanımsız) öğeler herkese görünür.
 * - Alt menülü öğe, en az bir görünür çocuğu varsa görünür (çocuklar filtrelenir).
 * - Boş kalan bölümler düşürülür.
 */
export function visibleSections(has: (permission: string) => boolean): NavSection[] {
  const allow = (item: NavItem) => !item.permission || has(item.permission)

  return NAV_SECTIONS.map((section) => {
    const items = section.items
      .map((item) => {
        if (item.children?.length) {
          const children = item.children.filter(allow)
          return children.length ? { ...item, children } : null
        }
        return allow(item) ? item : null
      })
      .filter((i): i is NavItem => i !== null)
    return { ...section, items }
  }).filter((s) => s.items.length > 0)
}

/** Verilen child key'in ait olduğu üst (parent) öğenin key'ini döndürür. */
export function findParentKey(key: string): string | undefined {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.children?.some((c) => c.key === key)) return item.key
    }
  }
  return undefined
}
