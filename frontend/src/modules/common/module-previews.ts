import type { FxIconName } from '../../fx-ui'
import type { PreviewColumn } from './preview/PreviewTable'

/** Önizleme özet kartı (değer "—" gösterilir; veri yok). */
export interface PreviewStat {
  icon: FxIconName
  label: string
  hint?: string
}

/** Önizleme bölümü — gerçek view düzenini (veri olmadan) temsil eder. */
export type PreviewSection =
  | { kind: 'table'; title: string; columns: PreviewColumn[]; rows?: number }
  | { kind: 'calendar'; title: string }
  | { kind: 'gallery'; title: string; tiles?: number }
  | { kind: 'cards'; title: string; cards?: number }

export interface ModulePreviewSpec {
  banner?: string
  stats?: PreviewStat[]
  sections?: PreviewSection[]
}

const C = (header: string, opts?: Partial<PreviewColumn>): PreviewColumn => ({ header, ...opts })

/**
 * Modül bazlı view-specific önizleme tanımları (nav key → spec).
 * Spec'i olan placeholder modüller gerçek düzenle (kart/tablo/takvim/galeri) önizlenir;
 * olmayanlar generic ModuleShell'e düşer. Hiç mock veri yok — yalnızca yapı.
 */
export const MODULE_PREVIEWS: Record<string, ModulePreviewSpec> = {
  /* ---- Tesis Operasyonu ---- */
  outbound: {
    stats: [
      { icon: 'truck', label: 'Bugünkü Çıkış', hint: 'fiş adedi' },
      { icon: 'activity', label: 'Toplam (KG)', hint: 'çıkan tartım' },
      { icon: 'package', label: 'Sevkiyata Bağlı', hint: 'açık' },
    ],
    sections: [
      { kind: 'table', title: 'Çıkışlar', rows: 7, columns: [
        C('Çıkış No', { width: 150 }), C('Tarih', { width: 120 }), C('Ürün'),
        C('Miktar', { align: 'right' }), C('KG', { align: 'right' }), C('Sevkiyat'), C('Durum', { width: 110 }),
      ] },
    ],
  },
  appointments: {
    stats: [
      { icon: 'calendar', label: 'Bugün', hint: 'randevu' },
      { icon: 'truck', label: 'Bekleyen', hint: 'giriş yapmamış' },
    ],
    sections: [
      { kind: 'calendar', title: 'Randevu Takvimi' },
      { kind: 'table', title: 'Randevular', rows: 6, columns: [
        C('Tarih', { width: 120 }), C('Ad Soyad'), C('Firma'), C('Plaka', { width: 110 }),
        C('Giriş', { width: 90, align: 'right' }), C('Çıkış', { width: 90, align: 'right' }),
      ] },
    ],
  },

  /* ---- Sevkiyat & Lojistik ---- */
  'shipment-planning': {
    stats: [
      { icon: 'truck', label: 'Planlı', hint: 'bekleyen sevkiyat' },
      { icon: 'activity', label: 'Yolda', hint: 'devam eden' },
      { icon: 'package', label: 'Teslim', hint: 'bu ay' },
    ],
    sections: [
      { kind: 'table', title: 'Sevkiyatlar', rows: 7, columns: [
        C('Sevkiyat No', { width: 150 }), C('Tarih', { width: 120 }), C('Araç'),
        C('Rota'), C('Yük', { align: 'right' }), C('Durum', { width: 110 }),
      ] },
    ],
  },
  'shipment-requests': {
    stats: [
      { icon: 'file-text', label: 'Bekleyen', hint: 'onay sırasında' },
      { icon: 'activity', label: 'Onaylı', hint: 'bu ay' },
    ],
    sections: [
      { kind: 'table', title: 'Talepler', rows: 7, columns: [
        C('Talep No', { width: 140 }), C('Tarih', { width: 120 }), C('Talep Eden'),
        C('Nokta'), C('Durum', { width: 120 }),
      ] },
    ],
  },
  'route-planning': {
    sections: [
      { kind: 'cards', title: 'Rota Planı (harita ileride)', cards: 3 },
      { kind: 'table', title: 'Planlanan Rotalar', rows: 6, columns: [
        C('Rota'), C('Nokta Sayısı', { align: 'right' }), C('Mesafe', { align: 'right' }), C('Durum', { width: 120 }),
      ] },
    ],
  },
  routes: {
    sections: [
      { kind: 'table', title: 'Rota Listesi', rows: 8, columns: [
        C('Rota', { width: 160 }), C('Tarih', { width: 120 }), C('Araç'),
        C('Nokta', { align: 'right' }), C('Maliyet', { align: 'right' }), C('Durum', { width: 110 }),
      ] },
    ],
  },
  'logistics-movements': {
    sections: [
      { kind: 'table', title: 'Lojistik Hareketleri', rows: 8, columns: [
        C('Tarih', { width: 120 }), C('Araç'), C('Sürücü'), C('Hareket'), C('Nokta'),
      ] },
    ],
  },
  dispatch: {
    stats: [
      { icon: 'file-text', label: 'Taslak', hint: 'kesilmemiş' },
      { icon: 'truck', label: 'Yolda', hint: 'teslim bekliyor' },
      { icon: 'activity', label: 'Teslim', hint: 'bu ay' },
    ],
    sections: [
      { kind: 'table', title: 'İrsaliyeler', rows: 8, columns: [
        C('İrsaliye No', { width: 150 }), C('Tarih', { width: 120 }), C('Müşteri'),
        C('Tutar', { align: 'right' }), C('Durum', { width: 120 }),
      ] },
    ],
  },
  locations: {
    sections: [
      { kind: 'cards', title: 'Harita (ileride)', cards: 1 },
      { kind: 'table', title: 'Lokasyonlar / Noktalar', rows: 8, columns: [
        C('Kod', { width: 120 }), C('Ad'), C('Bölge / İl'),
        C('Koordinat'), C('Tür', { width: 130 }),
      ] },
    ],
  },
  vehicles: {
    stats: [
      { icon: 'truck', label: 'Araç', hint: 'kayıtlı' },
      { icon: 'users', label: 'Sürücü', hint: 'atanmış' },
    ],
    sections: [
      { kind: 'table', title: 'Araç & Sürücüler', rows: 7, columns: [
        C('Plaka', { width: 130 }), C('Tip'), C('Sürücü'),
        C('Kapasite', { align: 'right' }), C('Durum', { width: 110 }),
      ] },
    ],
  },

  /* ---- Sayım & Saha ---- */
  'count-dashboard': {
    stats: [
      { icon: 'grid', label: 'Beklemede', hint: 'sayılacak' },
      { icon: 'activity', label: 'Sayılıyor', hint: 'devam eden' },
      { icon: 'package', label: 'Sayıldı', hint: 'tamamlanan' },
      { icon: 'file-text', label: 'Tamamlanma', hint: 'oran %' },
    ],
    sections: [
      { kind: 'table', title: 'Son Sayımlar', rows: 6, columns: [
        C('Sayım No', { width: 140 }), C('Tarih', { width: 120 }), C('Lokasyon'),
        C('Tip'), C('Durum', { width: 130 }),
      ] },
    ],
  },
  counts: {
    sections: [
      { kind: 'calendar', title: 'Sayım Takvimi' },
      { kind: 'table', title: 'Sayımlar', rows: 6, columns: [
        C('Sayım No', { width: 140 }), C('Planlanan Tarih', { width: 140 }), C('Lokasyon'),
        C('Atık Tipi'), C('Durum', { width: 130 }),
      ] },
    ],
  },
  'field-photos': {
    sections: [{ kind: 'gallery', title: 'Saha Fotoğrafları', tiles: 12 }],
  },
  panorama: {
    sections: [{ kind: 'gallery', title: 'Panorama Görüntüleri', tiles: 6 }],
  },
  'point-reports': {
    sections: [
      { kind: 'table', title: 'Nokta & Zincir Raporları', rows: 8, columns: [
        C('Nokta'), C('Zincir'), C('Sayım', { align: 'right' }),
        C('Tarih', { width: 120 }), C('Sonuç', { width: 120 }),
      ] },
    ],
  },

  /* ---- Ürün & Tanımlar ---- */
  haccp: {
    stats: [
      { icon: 'shield', label: 'Kontrol Noktası', hint: 'tanımlı' },
      { icon: 'activity', label: 'Açık Uygunsuzluk', hint: 'takipte' },
    ],
    sections: [
      { kind: 'table', title: 'Kontrol Noktaları', rows: 7, columns: [
        C('Kontrol Noktası'), C('Parametre'), C('Limit', { align: 'right' }),
        C('Son Kayıt', { width: 130 }), C('Durum', { width: 120 }),
      ] },
    ],
  },

  /* ---- İK / Muhasebe ---- */
  leave: {
    stats: [
      { icon: 'calendar', label: 'Bekleyen', hint: 'onay sırasında' },
      { icon: 'activity', label: 'Onaylı', hint: 'bu ay' },
      { icon: 'users', label: 'İzinde', hint: 'bugün' },
    ],
    sections: [
      { kind: 'table', title: 'İzin Talepleri', rows: 7, columns: [
        C('Personel'), C('Tür'), C('Başlangıç', { width: 120 }), C('Bitiş', { width: 120 }),
        C('Gün', { align: 'right' }), C('Durum', { width: 120 }),
      ] },
    ],
  },
  'work-report': {
    stats: [
      { icon: 'users', label: 'Bugün Çalışan', hint: 'giriş yapan' },
      { icon: 'activity', label: 'Toplam Mesai', hint: 'bu ay (saat)' },
    ],
    sections: [
      { kind: 'table', title: 'Çalışma Kayıtları', rows: 8, columns: [
        C('Personel'), C('Tarih', { width: 120 }), C('Giriş', { width: 90, align: 'right' }),
        C('Çıkış', { width: 90, align: 'right' }), C('Süre', { align: 'right' }), C('Mesai', { align: 'right' }),
      ] },
    ],
  },
  'personnel-expenses': {
    stats: [
      { icon: 'credit-card', label: 'Bu Ay Toplam', hint: 'personel masrafı' },
      { icon: 'activity', label: 'Bekleyen', hint: 'onay/avans' },
    ],
    sections: [
      { kind: 'table', title: 'Personel Masrafları', rows: 7, columns: [
        C('Personel'), C('Tarih', { width: 120 }), C('Tür'),
        C('Tutar', { align: 'right' }), C('Durum', { width: 120 }),
      ] },
    ],
  },

  /* ---- Belgeler / Sistem ---- */
  'document-list': {
    stats: [
      { icon: 'file-text', label: 'Toplam Belge', hint: 'arşivde' },
      { icon: 'bell', label: 'Süresi Dolan', hint: 'yenilenmeli' },
    ],
    sections: [
      { kind: 'table', title: 'Belgeler', rows: 8, columns: [
        C('Başlık'), C('Tür', { width: 140 }), C('Sahip'),
        C('Tarih', { width: 120 }), C('Son Geçerlilik', { width: 140 }),
      ] },
    ],
  },
  'document-reminders': {
    sections: [
      { kind: 'table', title: 'Hatırlatmalar', rows: 7, columns: [
        C('Belge'), C('Tür', { width: 140 }), C('Son Geçerlilik', { width: 140 }),
        C('Kalan Gün', { align: 'right' }), C('Durum', { width: 120 }),
      ] },
    ],
  },
  reports: {
    sections: [{ kind: 'cards', title: 'Rapor Şablonları', cards: 6 }],
  },
  sms: {
    stats: [
      { icon: 'message-square', label: 'Gönderilen', hint: 'bu ay' },
      { icon: 'activity', label: 'Bekleyen', hint: 'kuyrukta' },
    ],
    sections: [
      { kind: 'table', title: 'SMS Geçmişi', rows: 8, columns: [
        C('Tarih', { width: 130 }), C('Alıcı'), C('Şablon'), C('Durum', { width: 120 }),
      ] },
    ],
  },
  mail: {
    stats: [
      { icon: 'mail', label: 'Gönderilen', hint: 'bu ay' },
      { icon: 'activity', label: 'Bekleyen', hint: 'kuyrukta' },
    ],
    sections: [
      { kind: 'table', title: 'E-posta Geçmişi', rows: 8, columns: [
        C('Tarih', { width: 130 }), C('Alıcı'), C('Konu'), C('Durum', { width: 120 }),
      ] },
    ],
  },
}
