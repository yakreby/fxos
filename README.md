<div align="center">

# FxOs — Formex Operations System

**Formex'in tüm saha operasyonlarını yöneten bütünleşik ERP + CRM altyapısı**

Modüler · Ölçeklenebilir · Temiz Mimari · Düşük Dış Bağımlılık

</div>

---

## İçindekiler

1. [Proje Hakkında](#1-proje-hakkında)
2. [Teknoloji Yığını](#2-teknoloji-yığını)
3. [Mimari Genel Bakış](#3-mimari-genel-bakış)
4. [Solution Yapısı](#4-solution-yapısı)
5. [Modüller](#5-modüller)
6. [Frontend Mimarisi](#6-frontend-mimarisi)
7. [Kimlik Doğrulama & Yetkilendirme](#7-kimlik-doğrulama--yetkilendirme)
8. [Loglama & İzleme](#8-loglama--izleme)
9. [Dosya Depolama (Storage)](#9-dosya-depolama-storage)
10. [Bildirim Altyapısı](#10-bildirim-altyapısı)
11. [Kod & İsimlendirme Kuralları](#11-kod--isimlendirme-kuralları)
12. [Başlangıç (Getting Started)](#12-başlangıç-getting-started)
13. [Yol Haritası](#13-yol-haritası)

---

## 1. Proje Hakkında

**Formex**, bir *zero-waste* (sıfır atık) firmasıdır. Tarihi geçmiş ürünleri sahadan toplar, merkeze getirir ve ayrıştırır; bu hammaddelerden **yem katkı maddesi**, **granül** gibi ürünler üretir ve farklı kapalı süreçleri yönetir. Hem çevreye katkı hem de geri dönüşüm ile öne çıkan değerli bir kuruluştur.

**FxOs**, Formex'in bu lojistik ve operasyonel süreçlerini **kusursuz, maliyet-etkin, ölçeklenebilir ve uçtan uca takip edilebilir** hale getirmek için inşa edilen kurumsal bir panel sistemidir. Mevcut (eski) sistemin yerine geçecek; **onun hatalarını düzelterek daha iyisini** hedefliyoruz.

### Operasyon Akışı

```
Mal Kabul (tartım/KG) → Depolama (raf / octabin) → Sayım & Saha (foto/panorama/rapor)
   → Separasyon (ayrıştırma: geri kazanım / imha) → Çıkış & Sevkiyat (rota / irsaliye)
```

Yanında yatay modüller: **Ürün** kartları (atık/iade/işlem grupları), **Nokta/Lokasyon**, **HACCP**, **Evrak**, **İnsan Kaynakları** (izin, özlük, performans), **Muhasebe** (cari, masraf), **Raporlar**. Atık taksonomisi (iade grubu, atık grubu, işlem türü, atık lokasyon/tip) iş tarafından yönetilebilir; bu yüzden **hardcode değil, type-safe DB lookup** (`Definition`) olarak tutulur. Tüm modül/entity/API planı: [`docs/MODULES.md`](docs/MODULES.md).

### Tasarım İlkeleri

| İlke | Açıklama |
|------|----------|
| **Modülerlik** | Her iş alanı bağımsız bir modül. Yeni modül eklemek mevcut yapıyı bozmaz; kaldığın yerden devam edersin. |
| **Ölçeklenebilirlik** | Katmanlı yapı, repository pattern, async I/O, response compression. Yük arttıkça yatayda büyüyebilir. |
| **Temizlik (Clean Architecture)** | Bağımlılıklar tek yöne akar. İş kuralları altyapıdan izole. |
| **Düşük Dış Bağımlılık** | Mümkün olan en az 3. parti kütüphane. Tek bir bağlantının patlaması sistemi kilitlemez. |
| **Takip Edilebilirlik** | Her işlem loglanır (file + DB), frontend'den anlık izlenir. |
| **Type-safety** | Değişebilen listeler serbest string değil, **DB lookup + FK** (`Definition`); sabit kümeler enum. Join/include stabil. |
| **Eskinin Üstüne** | Eski sistemin tasarım hatalarını (tutarsız veri, serbest string'ler, dağınık UX) bilinçli düzeltiriz. |

---

## 2. Teknoloji Yığını

### Backend
- **.NET 8 (LTS)** — ASP.NET Core Web API
- **Entity Framework Core 8** — Code-First, Migrations
- **Microsoft SQL Server (MSSQL)**
- **ASP.NET Core Identity** — Cookie tabanlı kimlik doğrulama
- **Serilog** — File + MSSQL sink (yapılandırılmış loglama)
- **Repository + Unit of Work Pattern**
- **Dosya Depolama** — `FxOs.Storage` (soyutlama): yerel disk + **Cloudflare R2** (S3 uyumlu, `AWSSDK.S3`)

### Frontend
- **React 18 + TypeScript**
- **Vite** — Geliştirme sunucusu (`npm run dev`) ve build
- **Kendi CSS & Component Kütüphanemiz** (`fx-` prefix) — Bootstrap/Tailwind **yok**
- **Kendi Toast & Modal Kütüphanemiz** — toastr/sweetalert **yok**
- **Dark / Light Mode**

### Prensip
> En az dış bağımlılık. Her eklenen paket bir karar gerektirir; "olsa iyi olur" yeterli değildir.

---

## 3. Mimari Genel Bakış

FxOs, **Clean Architecture** prensiplerini izler. Bağımlılıklar daima **içe** (Domain'e) doğru akar:

```
┌─────────────────────────────────────────────────────────────┐
│                      FxOs.API (Presentation)                 │
│   Controllers · Middleware · DI · Auth · Swagger · Filters   │
└───────────────────────────────┬─────────────────────────────┘
                                 │ depends on
┌───────────────────────────────▼─────────────────────────────┐
│                      FxOs.Application                        │
│   Services · DTOs · Interfaces · Validation · Mapping        │
└───────────────┬───────────────────────────┬─────────────────┘
                │                            │
┌───────────────▼──────────┐   ┌─────────────▼────────────────┐
│   FxOs.Infrastructure    │   │      FxOs.Persistence        │
│  SMS · Email · Logging   │   │  DbContext · Repositories ·  │
│  FileStorage · External  │   │  Migrations · Configurations │
└───────────────┬──────────┘   └─────────────┬────────────────┘
                │                             │
                └──────────────┬──────────────┘
                               │ depends on
┌──────────────────────────────▼──────────────────────────────┐
│                        FxOs.Domain                           │
│   Entities (Guid) · Enums · Domain Interfaces · BaseEntity   │
└──────────────────────────────────────────────────────────────┘

        FxOs.Shared  ──► (cross-cutting: Result, Pagination, Helpers, Constants)
```

**Bağımlılık Kuralı:**
- `Domain` → hiçbir şeye bağımlı değil (saf iş modeli).
- `Application` → yalnızca `Domain` + `Shared`.
- `Infrastructure` / `Persistence` → `Application` + `Domain` (interface'leri implement eder).
- `API` → tümünü birleştirir (Composition Root), iş kuralı içermez.

---

## 4. Solution Yapısı

```
FxOs/
├── FxOs.sln
├── README.md                         # (bu dosya)
├── .gitignore
├── .editorconfig
│
├── src/
│   ├── FxOs.Domain/                  # Entity'ler, Enum'lar, Domain interface'leri
│   │   └── README.md
│   ├── FxOs.Application/             # Servisler, DTO'lar, iş kuralları, validation
│   │   └── README.md
│   ├── FxOs.Infrastructure/         # SMS, Email, Logging, dış servis implementasyonları
│   │   └── README.md
│   ├── FxOs.Persistence/            # EF Core DbContext, Repository'ler, Migration'lar
│   │   └── README.md
│   ├── FxOs.Shared/                 # Result<T>, PagedResult, Helper'lar, Constant'lar
│   │   └── README.md
│   ├── FxOs.Storage/                # Dosya depolama soyutlaması: yerel disk + Cloudflare R2
│   └── FxOs.API/                    # Controller'lar, Middleware, DI, Auth, Swagger
│       └── README.md
│
├── frontend/                         # React + TypeScript + Vite
│   ├── README.md
│   ├── package.json
│   └── src/
│       ├── fx-ui/                   # Kendi component kütüphanemiz (fx-)
│       ├── fx-ui-showcase/          # Component dokümantasyon/tanıtım arayüzü
│       ├── core/                    # api client, auth, theme, hooks
│       ├── layout/                  # Sidebar · Header · Content
│       └── modules/                 # Frontend modülleri (backend ile eşleşir)
│
└── docs/                             # Mimari kararlar, API sözleşmeleri, ER diyagramları
```

---

## 5. Modüller

Her modül; **Domain entity'leri**, **Application servisleri**, **API controller'ları** ve **Frontend ekranları** olarak dikey dilim halinde inşa edilir. Menü **operasyon-merkezli** gruplanır (eski sistemin üst-menü yapısına uyumlu). Durum: ✅ gerçek · 🟡 kısmi · ⏳ iskelet (placeholder + not).

| Bölüm | Modüller | Durum |
|-------|----------|-------|
| **Operasyon · Tesis** | Tesis Paneli, Mal Kabul, Çıkışlar, Stok, Raflar, Hareket Detayı, Octabin, Separasyon, Randevular | ⏳ |
| **Operasyon · Sevkiyat & Lojistik** | Sevkiyat Planlama, Talepler, Rota Planlama/Listesi, Lojistik Hareketleri, İrsaliyeler, Lokasyonlar, Araç & Sürücüler | ⏳ |
| **Operasyon · Sayım & Saha** | Sayım Paneli, Sayımlar (takvim), Saha Fotoğrafları, Panorama, Nokta/Zincir Raporları | ⏳ |
| **Yönetim · Ürün & Tanımlar** | Ürünler, Tanımlamalar (`Definition` lookup), HACCP | ⏳ |
| **Yönetim · İnsan Kaynakları** | Personel ✅, İzin, Çalışma Raporu, Performans/İşlem Geçmişi | 🟡 |
| **Yönetim · Muhasebe** | Cari Hesaplar ✅, Masraf, Personel Masrafı | 🟡 |
| **Yönetim · Belgeler** | Belgeler (özlük ✅), Hatırlatmalar | 🟡 |
| **Sistem** | Bildirimler ✅, Loglar ✅, Roller & İzinler ✅, SMS/Mail, Rapor Merkezi | 🟡 |

> Tüm modüllerin **amacı + planlanan entity & API uçları**: [`docs/MODULES.md`](docs/MODULES.md). Sıradaki build sırası: [`docs/TODO.md`](docs/TODO.md) (D2).
>
> **Modülerlik notu:** Yeni modül = Domain entity + Application servis/DTO + API controller (`[HasPermission]`) + migration + Frontend ekran. Çekirdek altyapı (auth, log, tablo, bildirim, dosya depolama, server-side FxTable) hazır.

---

## 6. Frontend Mimarisi

### Layout
```
┌──────────────────────────────────────────────┐
│  Header  (kullanıcı, tema, bildirim, çıkış)   │
├───────────┬──────────────────────────────────┤
│           │                                   │
│  Sidebar  │           Content                 │
│  (sol)    │      (tablolar & formlar)         │
│           │                                   │
└───────────┴──────────────────────────────────┘
```

### `fx-ui` — Kendi Component Kütüphanemiz
- CSS class isimlendirmesi `fx-` prefix ile (ör. `fx-flex` → `display:flex`).
- Atomic utility + bileşen yaklaşımı, minimum dış bağımlılık.
- **`fx-ui-showcase`**: Tüm component'leri canlı örnek + kullanımıyla tanıtan iç dokümantasyon arayüzü (ekipteki diğer geliştiriciler için).

### `FxTable` — Ortak Tablo Bileşeni
Tüm listeleme ekranları tek bir tablo bileşenini kullanır. Varsayılan yetenekler:
- Header'a göre **sıralama** (sort)
- **Filtreleme** (filter)
- **Pagination** + **sayfa başına kayıt** (entity per page)
- **Tablo içi arama** (search)
- Ortak/paylaşılan istek-yanıt scriptleri (server-side veya client-side)

### Tema
- Dark / Light mode, CSS değişkenleri (custom properties) üzerinden.

---

## 7. Kimlik Doğrulama & Yetkilendirme

- **ASP.NET Core Identity** + **HttpOnly Cookie**.
- Oturum/cookie varsayılan **1 hafta (7 gün)** saklanır (`SlidingExpiration`).
- Cross-origin (frontend ↔ API) için **CORS** + `SameSite=None; Secure` baştan yapılandırılır.
- **Rol bazlı yetkilendirme** — herkes her şeye erişemez; izinler (Permission) yönetilebilir.
- **2FA** — altyapı uygun bırakılır, ilerleyen aşamada devreye alınır.
- Login · Logout · Authentication · Authorization tam akış.

---

## 8. Loglama & İzleme

Profesyonel loglama **en baştan** kurulur:

| Hedef | Açıklama |
|-------|----------|
| **File Log** | Günlük dönen (rolling) yapılandırılmış log dosyaları |
| **DB Log** | MSSQL'de loglar — frontend'den sorgulanabilir & filtrelenebilir |
| **Frontend Log Akışı** | Sistem ve işlem loglarının panelden anlık takibi |

- **Serilog** ile structured logging.
- Request/Response, hata, kullanıcı işlemleri ve domain olayları loglanır.

---

## 9. Dosya Depolama (Storage)

Belge/dosya yükleme, **sağlayıcıdan bağımsız** bir soyutlama (`FxOs.Storage`) üzerinden yapılır. Domain/Application bu ayrı kütüphaneye değil, yalnızca `IFileStorage` sözleşmesine bakar; aktif sağlayıcı **config ile** seçilir.

| Sağlayıcı | Açıklama |
|-----------|----------|
| **Local** *(varsayılan)* | Dosyalar API sunucusundaki yapılandırılmış klasörde (`Storage:Local:RootPath`). Geliştirme/ilk kurulum. |
| **Cloudflare R2** | S3 uyumlu nesne depolama (`AWSSDK.S3`). Yükleme + yedekleme için hedef çözüm; kimlik bilgileri tanımlanınca `Storage:Provider=r2` ile devreye alınır. |

```jsonc
// appsettings.json
"Storage": {
  "Provider": "local",            // "local" | "r2"
  "Local": { "RootPath": "App_Data/storage" },
  "R2": {
    "ServiceUrl": "https://<accountid>.r2.cloudflarestorage.com",
    "AccessKey": "", "SecretKey": "", "Bucket": "", "PublicBaseUrl": ""
  }
}
```

- **Sözleşme:** `IFileStorage` → `SaveAsync` / `OpenReadAsync` / `DeleteAsync`. Anahtarlar (key) Guid tabanlı üretilir; orijinal ad meta veride saklanır.
- **Güvenlik/limit:** Yüklemede tür allowlist'i + boyut sınırı (20 MB) controller'da uygulanır; yerel sağlayıcıda path-traversal koruması var.
- **R2 notu:** S3 uyumlu olduğu için AWS SDK ile konuşulur; R2'nin desteklemediği varsayılan checksum davranışı `WHEN_REQUIRED` olarak ayarlandı. Kimlik bilgileri gelene kadar yerel sağlayıcı aktiftir.
- **İlk kullanan:** Personnel **özlük belgeleri** (`Document` modülü). İleride başka modüller de aynı soyutlamayı kullanır.

> Üretimde: dosyalar repoya girmez (`App_Data/` gitignore'da); R2'ye geçişte yedekleme R2 tarafında yönetilir.

---

## 10. Bildirim Altyapısı

İki türlü bildirim:

1. **İşlem Bildirimleri (Toast)** — Frontend'de anlık geri bildirim (başarı/hata/uyarı). Kendi `fx-toast` kütüphanemizle.
2. **Kullanıcı Bildirimleri (Persistent)** — İşlemlerle ilgili kalıcı bildirimler; DB'de saklanır, kullanıcıya panelde sunulur (okundu/okunmadı).

> `toastr.js` / `sweetalert` yerine kendi kütüphanemiz: hız + genişletilebilirlik + sıfır dış bağımlılık.

---

## 11. Kod & İsimlendirme Kuralları

| Kural | Detay |
|-------|-------|
| **Dil** | Tüm **Entity** ve **Controller** isimleri **İngilizce**. |
| **Primary Key** | Tüm entity'ler **`Guid`** ile yönetilir. **`int id` kullanılmaz.** |
| **Bağımlılık** | Katmanlar arası bağımlılık **SOLID**'e göre, tek yönlü. |
| **Repository Pattern** | Veri erişimi repository'ler üzerinden soyutlanır. |
| **Helper'lar** | Tekrar eden işlemler helper class'larla çözülür. |
| **Response Compression** | Hızlı veri aktarımı için açık. |
| **Frontend CSS** | `fx-` prefix (ör. `fx-flex`). |
| **README** | Root + her projenin kendi README'si. |

---

## 12. Başlangıç (Getting Started)

> Bu bölüm projeler oluşturulduktan sonra kesinleştirilecektir.

### Önkoşullar
- .NET 8 SDK
- Node.js 20+ & npm
- MSSQL (lokal veya uzak)

### Backend
```bash
cd src/FxOs.API
dotnet restore
dotnet ef database update      # migration'ları uygula
dotnet run                     # API ayağa kalkar
```

### Frontend
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173 (lokal API'ye bağlanır)
```

Bağlantı noktaları (API portu, CORS origin, connection string) ilk kurulumda yapılandırılacaktır. Geçici uzak MSSQL connection ile başlanacak, ardından gerçek sunucu DB'sine geçilecektir.

---

## 13. Yol Haritası

- [x] **Faz 0 — Temel İskelet:** Solution + backend projeleri + frontend iskeleti, README'ler. ✅
- [x] **Faz 1 — Çekirdek Altyapı:** EF Core + MSSQL, Identity + Cookie auth, Serilog (file+db), compression, `Result<T>` & global exception handling, Repository+UoW. ✅
- [x] **Faz 2 — Frontend Çekirdeği:** `fx-ui` (+ form bileşenleri, FxFormError), showcase, layout, tema, `FxToast`/`FxModal`/`FxTable` (server-side mod), router, gerçek API client. ✅
- [x] **Faz 3 — Identity & Access:** Kullanıcı/Rol/Permission + izin bazlı sidebar; cookie auth uçtan uca. ✅
- [~] **Faz 4 — İş Modülleri (devam):** Personnel ✅, Cari/Ön Muhasebe ✅, Bildirimler ✅, Loglar ✅, Belge/Storage 🟡. **Sırada (build sırası):** Tanımlamalar → Ürünler → Mal Kabul → Stok/Raf → Sayım → Sevkiyat/İrsaliye → Dashboard/Raporlar. + yatay UX: copy button, view-specific placeholder. Detay: [`docs/MODULES.md`](docs/MODULES.md) · [`docs/TODO.md`](docs/TODO.md).
- [ ] **Faz 5 — Olgunlaştırma:** R2 dosya depolama, belge hatırlatma, gelir/gider, SMS/Mail, raporlar, 2FA.
- [ ] **Faz 6 — Dağıtım:** Vercel (frontend) + sunucu (API+MSSQL), CI, secrets.

> **Geliştirme durumu ve sıradaki işler:** [`docs/HANDOFF.md`](docs/HANDOFF.md) (kaldığımız yer) ve [`docs/TODO.md`](docs/TODO.md) (gelecek işler).

---

<div align="center">

**FxOs** · Cerrah titizliğinde inşa edilir 🩺

</div>
