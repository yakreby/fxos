# FxOs Frontend

> React + TypeScript + Vite. Kendi `fx-ui` component kütüphanemizle inşa edilir — Bootstrap/Tailwind yok, dış bağımlılık minimumda.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run dev` dev sunucusunu açar; `/api` istekleri `.env`'deki `VITE_API_PROXY_TARGET` adresine (local API) proxy'lenir — böylece cookie tabanlı auth'ta CORS sorunu yaşanmaz (aynı-origin gibi davranır).

### Komutlar
| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu (HMR) |
| `npm run build` | Tip kontrolü + üretim build'i |
| `npm run typecheck` | Sadece TypeScript tip kontrolü |
| `npm run lint` | ESLint |

## Ortam Değişkenleri

`.env.example` dosyasını `.env` olarak kopyalayın:

| Değişken | Açıklama |
|----------|----------|
| `VITE_API_BASE_URL` | İstemcinin kullandığı API kök yolu (dev'de `/api`) |
| `VITE_API_PROXY_TARGET` | Dev proxy'nin hedefi (local API adresi) |

## Klasör Yapısı

```
src/
├── core/                      # Çekirdek (UI olmayan altyapı)
│   ├── api/client.ts          # Cookie-auth fetch sarmalayıcı (Result zarfı)
│   ├── auth/SessionContext    # Oturum (şimdilik sahte; Faz 1'de API'ye bağlanır)
│   ├── hooks/useClickOutside  # Dropdown/popover dışına tıklama
│   └── theme/ThemeContext     # Dark/Light tema (data-theme + localStorage)
│
├── fx-ui/                     # Kendi component kütüphanemiz (Fx*, fx-* class)
│   ├── FxIcon                 # Inline SVG ikon seti (+ FX_ICON_NAMES)
│   ├── FxButton, FxBadge, FxAvatar, FxCard, FxStatCard
│   ├── FxPopover              # Tetikleyici + click-outside açılır panel
│   ├── FxScrollTop            # "Başa dön" butonu
│   ├── table/FxTable          # Sıralama + arama + pagination + sayfa boyutu
│   ├── toast/                 # FxToast altyapısı (ToastProvider + useToast)
│   └── index.ts               # Barrel export
│
├── fx-ui-showcase/           # "fx-debug" — bileşen kütüphanesi kataloğu
├── layout/                    # AppLayout · Sidebar · Header · NotificationMenu · AiBubble
├── modules/                   # İş modülleri (backend ile eşleşir)
│   ├── dashboard/             # Genel Bakış (gerçek demo)
│   ├── settings/              # Ayarlar
│   ├── auth/LoginPage         # Giriş ekranı (şimdilik sahte auth)
│   └── common/PlaceholderPage # İnşa edilmemiş modüller için ortak sayfa
└── styles/
    ├── fx-theme.css           # Tema değişkenleri (light/dark)
    ├── fx-base.css            # Reset + fx-* utility + scrollbar/selection
    └── fx-components.css      # Tüm bileşen stilleri
```

## fx-ui Bileşenleri (özet)

| Bileşen | Ne işe yarar |
|---------|--------------|
| `FxButton` | Buton — variant: primary/subtle/ghost/danger, size: sm/md |
| `FxBadge` | Durum/etiket rozeti — 6 ton |
| `FxAvatar` | İsimden baş harf avatarı |
| `FxCard` | Yüzey kartı (başlık + aksiyon) |
| `FxStatCard` | Dashboard istatistik kutucuğu |
| `FxIcon` | Inline SVG ikon (currentColor, sıfır bağımlılık) |
| `FxPopover` | Açılır panel (notification/kullanıcı menüsü) |
| `FxScrollTop` | İçerik kaydırınca beliren "başa dön" |
| `FxTable` | Ortak tablo: sıralama, arama, pagination, sayfa boyutu |
| `FxToast` / `useToast` | Kendi toast bildirim altyapımız |

> **fx-debug**: Header'daki `fx-debug` butonu tüm bileşenlerin canlı kataloğunu, ikon galerisini ve `fx-` class referansını gösterir. Ekip için tek referans noktası.

## Konvansiyonlar

- **CSS class'ları `fx-` prefix'li** (ör. `fx-flex` → `display:flex`).
- **Bileşen adları `Fx` prefix'li** (ör. `FxButton`, `FxTable`).
- Tema, `<html data-theme="light|dark">` üzerinden; renkler CSS değişkenlerinden gelir, sabit renk gömülmez. Dark marka rengi `#48d736`.
- Toast/modal için 3. parti yerine **kendi `fx-ui` bileşenlerimiz**.

## Durum (2026-06-05)

- **Tamam:** Tema altyapısı, `fx-ui` çekirdek bileşenleri, layout kabuğu (sidebar dropdown + collapse), header menüleri (bildirim + kullanıcı), login (sahte), settings, FxTable, FxToast, fx-debug showcase, gezilebilir placeholder sayfalar.
- **Sırada:** Gerçek router (auth-korumalı rotalar), API entegrasyonu (cookie auth), modül ekranlarının uçtan uca inşası, FxInput/FxModal/FxSelect gibi form bileşenleri.

> Detaylı yol haritası için kök dizindeki [`docs/TODO.md`](../docs/TODO.md) ve [`docs/HANDOFF.md`](../docs/HANDOFF.md).
