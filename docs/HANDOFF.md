# FxOs — Handoff / Kaldığımız Yer

> Son güncelleme: **2026-06-10** (… + **Octabin** + **Separasyon** + **Excel/PDF/CSV dışa aktarma altyapısı** + **Dijital Tesis Haritası** + sunum öncesi temizlik — [`MODULES.md`](MODULES.md))
> Amaç: Yeni bir oturumda projeye hızlıca geri dönebilmek. "Ne var, ne yok, nereden devam" özeti.

---

## 1. Tek Cümle

FxOs, Formex (zero-waste firma) için kurulan modüler ERP+CRM saha operasyon sistemi: **.NET 8 Clean Architecture API + React/TS (Vite) frontend**, kendi `fx-ui` kütüphanemiz, MSSQL + EF Core, cookie tabanlı Identity (henüz bağlanmadı).

## 2. Onaylanmış Kararlar

| Konu | Karar |
|------|-------|
| Backend | .NET 8 LTS (global.json ile 8.0.404'e pinli) |
| Frontend | TypeScript + Vite + React 19 |
| Auth | HttpOnly Cookie + ASP.NET Core Identity, oturum 1 hafta (henüz kurulmadı) |
| Mimari | Clean Architecture (Domain → Application → Infra/Persistence → API) |
| DB | MSSQL + EF Core (code-first) — connection string **henüz verilmedi** |
| Frontend stil | Kendi `fx-ui`'miz, `fx-` prefix, dark marka `#48d736`. Bootstrap/Tailwind YOK |
| PK | Tüm entity'ler Guid; int id YOK |
| İsimlendirme | Entity/Controller İngilizce |

## 3. Şu An Çalışan Durum

### Backend (`src/`) — Faz 0 iskeleti + **Faz 1 altyapı (TAMAM)**
- `FxOs.sln` + 6 proje: **Domain, Application, Infrastructure, Persistence, Shared, API** (referanslar tek yönlü, doğru bağlı).
- `Domain/Common/BaseEntity.cs` — Guid Id + audit + soft-delete alanları.
- `Domain/Identity/` — `ApplicationUser`/`ApplicationRole` (Guid), `FxRoles` sabitleri.
- `Shared/Results/Result.cs` + `Shared/Pagination/` — değişmedi.
- **Application:** `Common/Interfaces/` → `ICurrentUser`, `IFxOsDbContext`, `IRepository<T>`, `IUnitOfWork`; `AddApplication()`.
- **Persistence:** `FxOsDbContext : IdentityDbContext<...,Guid>` (soft-delete global filter + SaveChanges audit), `FxOsDbContextFactory` (design-time), generic `Repository<T>` + `UnitOfWork`, `IdentityDataSeeder`, `AddPersistence()`. `Migrations/InitialCreate` **remote DB'ye uygulandı**.
- **Infrastructure:** `CurrentUser` (IHttpContextAccessor), `AddInfrastructure()`.
- **API `Program.cs`:** Serilog (console+file+MSSQL sink), `AddApplication/Infrastructure/Persistence`, Identity+cookie auth (401/403 Result gövdeli), CORS (5173, AllowCredentials), response compression, `ExceptionHandlingMiddleware` (exception hiyerarşisi → status+Result), açılışta seed, Swagger.
- **Hata altyapısı:** `Application/Common/Exceptions/` → `FxException` + NotFound/Validation/Conflict/Forbidden/BusinessRule; `API/Common/ApiResponseWriter` ortak Result yazıcı. Controller'lar bu exception'ları fırlatır, middleware doğru HTTP koduna çevirir.
- **Auth & yetki:** `AuthController` (login/logout/me). **İzin sistemi:** `Application/Common/Authorization/Permissions` (katalog); permission'lar **rol claim** → giriş anında principal'a akar; `API/Authorization/` → `HasPermissionAttribute` + `PermissionPolicyProvider` + handler. Admin seed'i tüm izinlere sahip.
- **Identity & Access API:** `UsersController` (list paginated/get/create/update/delete), `RolesController` (CRUD + sistem rolü koruması), `PermissionsController` (katalog) — hepsi `[HasPermission]` korumalı. Uçtan uca test edildi (CRUD + 403 + 404 + 422).
- **Personnel modülü (ilk gerçek iş modülü):** `Domain/Personnel/` → `Personnel` (ilk `BaseEntity` türevi), `Department`/`Position` lookup'ları, `PersonnelStatus` enum. `Persistence/Configurations/` EF eşlemeleri. `Application/Personnel/` DTO'lar + `PersonnelStatusLabels`. `personnel.*` izin grubu. `PersonnelController` **generic Repository+UnitOfWork kullanan ilk controller** (server-side pagination/arama/sıralama/durum filtresi); `Departments`/`PositionsController` lookup CRUD (isim çakışması 409, kullanımdaki kayıt silme 422, personnelCount). `AddPersonnel` migration remote DB'ye uygulandı. Uçtan uca test edildi (CRUD + 400/409/422 + soft-delete).
- **Belge modülü + depolama:** Yeni proje **`FxOs.Storage`** — `IFileStorage` soyutlaması + `LocalFileStorage` (varsayılan) + `R2FileStorage` (Cloudflare R2, S3 uyumlu, `AWSSDK.S3`); sağlayıcı `Storage:Provider` ile seçilir. `Domain/Documents/` → `Document` (personele bağlı, dosya meta + `ExpiryDate`) + `DocumentType` enum. `documents.*` izinleri. `DocumentsController` → upload (multipart, 20MB + tür allowlist), download (stream), liste (personel bazlı), metadata güncelle, sil (depo+soft). `AddDocuments` migration uygulandı. **R2 henüz aktif değil** (kimlik bilgisi bekleniyor; yerel disk aktif, `App_Data/` gitignore'da). Uçtan uca test edildi.
- **Derleme:** `dotnet build` → 0/0 (7 proje: + FxOs.Storage). **Çalıştırma doğrulandı:** API `http://localhost:5137`, Swagger 200, seed admin+roller+izinler.
- **Tanımlamalar modülü (type-safe lookup temeli):** `Domain/Definitions/` → `Definition` (tek tablo) + `DefinitionType` enum (WasteLocation/WasteType/ReturnGroup/WasteGroup/ProcessType/ProductGroup). `DefinitionConfiguration` (index Type+Name). `Application/Definitions/` DTO'lar + `DefinitionTypeLabels`. `definitions.*` izinleri. `DefinitionsController` (`api/definitions` + `/types`; tür içinde ad+kod benzersizliği 409; 400/404). `DefinitionSeeder` (başlangıç değerleri, idempotent — Program.cs açılışta çağırır). `AddDefinitions` migration remote DB'ye uygulandı. Uçtan uca test edildi (CRUD + 409/400/404 + seed). **Diğer modüller (Ürün/Sayım/Sevkiyat) buna FK ile bağlanacak.**
- **Ürünler modülü:** `Domain/Products/` → `Product` (müşteri Account FK + dört `Definition` FK'si + `PackageType` enum). `ProductConfiguration` (Restrict FK'ler, kod/barkod index). `Application/Products/` DTO'lar + `PackageTypeLabels`. `products.*` izinleri. `ProductsController` (`api/products` + `/package-types`; server-side liste; **Definition FK tür-uyumu doğrulanır**; kod/barkod 409; 400/404). Cari dropdown için `AccountsController` `/lookup` ucu. `AddProducts` migration uygulandı. Uçtan uca test edildi (CRUD + 409 + tür uyumsuzluğu 400 + 404). *(Kalan: Excel içe aktarma.)*
- **Mal Kabul modülü (MVP):** `Domain/GoodsReceipts/` → `GoodsReceipt` (+`GoodsReceiptLine`) + `GoodsReceiptStatus` enum. Başlık: otomatik fiş no (`MK-yyyyMMdd-####`), tedarikçi (Account FK), durum, not; satır: ürün (Product FK), miktar, tartım (KG), not. `GoodsReceiptsController` (`api/goods-receipts` + `/statuses`; server-side liste + satır toplamları; başlık CRUD; `{id}/lines` ekle, `lines/{lineId}` sil; no 409; 400/404). `goodsreceipts.*` izinleri. Ürün dropdown'ı için `ProductsController` `/lookup`. `AddGoodsReceipts` migration uygulandı. Uçtan uca test edildi. **Kalan:** stok girişi + raf/octabin adresleme + adresleme analizi (Stok/Octabin modülleriyle).
- **Mal Kabul → Stok entegrasyonu:** `GoodsReceiptLine`'a `ShelfId` (raf adreslemesi), `StockMovement`'a `GoodsReceiptId` (kaynak bağı). `GoodsReceiptsController` `{id}/confirm` (Taslak→Onaylı: her satır için Giriş/Mal Kabul stok hareketi, satırın rafına; idempotent) + `{id}/cancel` (üretilen hareketleri geri al). Onaylı/iptal fişte satır+başlık düzenleme kilitli (422). Durum artık form'dan değil Onayla/İptal aksiyonlarından. `GoodsReceiptStockLink` migration. Uçtan uca test (onay→stok→kilit→iptal→geri alma + idempotent).
- **Stok & Raflar modülü:** `Domain/Stock/` → `Shelf` + `StockMovement` (+ `StockDirection`/`StockMovementType` enum). **Eldeki stok hareketlerden hesaplanır** (Σgiriş−Σçıkış; PreAccounting bakiye deseni, ayrı StockItem tablosu yok). `ShelvesController` (CRUD + doluluk; kod 409; kullanımdaki raf 422) + `StockController` (`/meta`, current stok, `/movements` server-side ledger + ekle/sil, `/transfer` iki hareket üretir). `shelves.*` + `stock.*` izinleri. `AddStock` migration uygulandı. Uçtan uca test edildi (giriş/çıkış/transfer matematiği + doluluk + 409/422/400).
- **Octabin modülü (standalone):** `Domain/Octabins/` → `Octabin` (tek tablo, satırsız) + `OctabinStatus` enum (Açık/Dolu/Sevk Edildi). İçerik **esnek**: `WasteTypeId` (Definition FK, tür=WasteType — tür-uyumu doğrulanır) ve/veya `ProductId` (Product FK) ve/veya `Content` (serbest); `ShelfId` (lokasyon); `Capacity`/`NetWeight` → **doluluk %** (DTO'da hesaplanır). Otomatik no `OCT-yyyyMMdd-####`. `OctabinsController` (`api/octabins` + `/statuses`; server-side liste + status filtre; CRUD; **durum akışı** `{id}/close` Açık→Dolu, `{id}/reopen` Dolu→Açık, `{id}/dispatch` Dolu→Sevk Edildi; sevk edilen kilitli; no 409; içerik FK doğrulama 400). `octabins.*` izinleri. `AddOctabin` migration remote DB'ye uygulandı. Build 0/0. **Kalan:** sevk→stok çıkışı entegrasyonu (sonra); octabin raporu.
- **Separasyon modülü (standalone):** `Domain/Separations/` → `SeparationRequest` (tek tablo) + `SeparationStatus` enum (Beklemede/Ayrıştırılıyor/Tamamlandı/İptal). İçerik/işlem/sonuç **Definition FK** (tür-uyumu doğrulanır): `WasteTypeId` (WasteType), `ProcessTypeId` (ProcessType), `ResultGroupId` (WasteGroup); `AssignedPersonnelId` (**işlem personele damgalanır** — performans), `ProductId`, `ShelfId`, serbest `Content`, `PalletCount`, `Weight`. Otomatik no `SEP-yyyyMMdd-####`. `SeparationsController` (`api/separations` + `/statuses`; server-side liste + status filtre; CRUD; **durum akışı** `{id}/start|complete|reopen|cancel`; tamamlanan/iptal kilitli; çok-FK tür doğrulama 400). `separations.*` izinleri. **`PersonnelController` `/lookup` ucu eklendi** (aktif personel id+ad). `AddSeparation` migration uygulandı. Build 0/0. **Kalan:** performans panosu (`PersonnelActivity`).
- **Dışa Aktarma (Excel/PDF/CSV) — yatay altyapı:** `Application/Common/Export` (`ExportTable`/`ExportColumn`/`ExportFormat`/`ExportFile`) + `IExportService`; `Infrastructure/Export/ExportService` → **CSV** (UTF-8 BOM, `;`), **Excel** (ClosedXML `.xlsx`), **PDF** (QuestPDF A4 yatay; Community lisans static ctor'da). `IExportService` singleton (`AddInfrastructure`). `API/Common/ExportHelpers` (format parse, tr-TR biçim, gün-sonu, tarih etiketi). **Mal Kabul / Octabin / Separasyon** controller'larına `GET export?from&to&status&format` → `File(...)`. Frontend: `core/api/client.downloadFile` (cookie-auth blob + Content-Disposition) + `modules/common/ExportButton` (tarih aralığı + format modalı) 3 liste sayfasında. **Uçtan uca doğrulandı:** login → `octabins/export` PDF(22KB)/Excel(6.6KB)/CSV 200 + doğru MIME. Paketler: `ClosedXML 0.105`, `QuestPDF 2026.5`. **⚠️ QuestPDF Community lisansı:** ticari ciro şartı — gerekirse PDFsharp'a geçilebilir (IExportService izole). **Kalan:** diğer listelere ekle (Ürün/Stok/Cari/Personel).
- **Dijital Tesis Haritası modülü (2026-06-10):** `Domain/Facility/` → `FacilityNode` (`BaseEntity` türevi: ad, şehir, `NodeType` Genel Merkez/Toplama Merkezi/Tesis, `Status` Aktif/Planlı/Pasif, **`Latitude`/`Longitude`** — ileride `Location`'a bağlanır, açıklama, sıra). `FacilityNodeConfiguration`; `Application/Facility/` DTO + Türkçe etiketler + meta; `facility.*` izinleri (katalog "Dijital Tesis"). `FacilityController` (`api/facility/nodes` liste — sayfalanmaz + CRUD + `/meta`). `FacilityNodeSeeder` (İstanbul GM + Bursa/Tophisar + Kocaeli/Sakarya/İzmir/Balıkesir/Eskişehir aktif + Ankara planlı; idempotent, `Seed:Facility`) → Program.cs. `AddFacility` migration **remote DB'ye uygulandı**, seed çalıştı. **Design-time factory** artık `appsettings.Development.local.json` okur (EF komutları secret hijyeniyle çalışsın diye). Uçtan uca test (login → `facility/nodes` 8 nokta). **Frontend:** `modules/facility/` → `facility-api.ts` + **`TurkeyMap.tsx`** (sıfır dış bağımlılık, inline SVG; gerçek Türkiye sınır verisi + **kendi equirectangular projeksiyonu** → marker hizalaması kusursuz; GM'den toplama noktalarına animasyonlu ağ çizgileri + atan-nabız düğümler + hover detay kartı + lejant; tech-dark panel, marka neon) + co-located `TurkeyMap.css`. **Dashboard'a hero panel** olarak gömüldü ("Dijital Tesis Haritası" kartı, "Tesis Paneli" kısayolu). **Yönetim view'ı (Sevkiyat & Lojistik → "Lokasyon Haritası", `/locations`, `facility.view`):** gerçek gezilebilir **Leaflet + CARTO dark** haritası (API key gerekmez; vanilla Leaflet → React 19 peer-dep yok) — **haritaya tıkla → koordinat otomatik → nokta ekle**, marker'a tıkla → düzenle/sil, altında nokta tablosu. `FacilityLeafletMap` + `FacilityNodeFormModal` + `FacilityMapPage`; nav `locations` öğesi aktive edildi (eski placeholder kaldırıldı). **Sayfa lazy-load** (Leaflet ana bundle'dan ayrı 156KB chunk; ana bundle 451KB'da kaldı). Uçtan uca CRUD test edildi (create/update/delete + soft-delete). **Dashboard hero artık Leaflet** (`mode="view"`, lazy): noktaların üzerine gelince **animated tech istatistik kartı** (müşteri/palet/tonaj/son plaka/haftalık hareket — `facility-mock.ts`'ten deterministik **mock**, ileride Sayım/Hareket modüllerinden beslenecek). SVG (`TurkeyMap`) **silinmedi, yorumda** — offline fallback (tile internet ister; salon wifi'ı koparsa tek satırla SVG'ye dönülebilir). **Dört nokta türü:** Genel Merkez / Toplama Merkezi / Tesis / **Dağıtım Merkezi** (yeni, teal marker). Seed **12 nokta**: İstanbul GM + 6 toplama + 5 dağıtım (Ankara/Antalya/Konya/Denizli/Trabzon). FxModal z-index düzeltmesi: `.fx-lmap { isolation: isolate }` (Leaflet pane'leri modal'ın arkasında kalmasın). **Bağımlılık:** `leaflet ^1.9` + `@types/leaflet`. **Kalan:** mock istatistikleri gerçek veriye bağla, gerçek `Location`/koordinat ile birleşme, hiyerarşik drill-down.
- **UI hızlı düzeltmeler (2026-06-08):** Dashboard başlık "Formex Yönetim Paneli" + sistemle ilgili alt başlık + "Hızlı Erişim Menüsü"; Loglar başlığı "Sistem Kayıtları · Loglar"; **mobil `.fx-content` padding bug'ı** (`--fx-space-5` tanımsız → 32px kalıyordu) 1rem'e + üst nefes payı; mobil bildirim menüsü viewport sağına sabit (`fx-notif-popover`).
- **Henüz YOK:** kalan iş modülleri (Sayım, Sevkiyat, Dispatch, Octabin/sevk-stok entegrasyonu vb.), belge hatırlatma (reminder), 2FA. **Yeni yön fikirleri:** Dijital Tesis (harita), İK CV havuzu/başvuru, İSG yönetimi (bkz. `TODO.md` G + hafıza).

### Frontend (`frontend/`) — Faz 2 büyük ölçüde tamam
Çalıştırma: `cd frontend && npm install && npm run dev` → http://localhost:5173

Mevcut:
- **Tema:** dark/light, CSS değişkenleri, localStorage; dark marka `#48d736`.
- **fx-ui bileşenleri:** FxIcon (+galeri), FxButton, FxBadge, **FxCopyButton** (panoya kopyala + ✓ onay; detay alanlarında hover'da belirir), FxAvatar, FxCard, FxStatCard, FxPopover, FxScrollTop, **FxTable** (sıralama/arama/pagination/sayfa boyutu), **FxToast** (`useToast`), **FxModal** (portal), **form:** FxField/FxInput/FxTextarea/FxSelect/FxCheckbox/FxDatePicker (label+zorunlu+hata/hint).
- **Layout:** AppLayout + Sidebar (dropdown alt menü + collapse · **"Tümünü kapat"** + **© Formex** footer · **mobilde off-canvas drawer**) + Header (fx-debug linki, bildirim menüsü, kullanıcı menüsü, tema toggle, Formex logosu tema-duyarlı) + AiBubble (geçici).
- **Sayfalar:** LoginPage (**gerçek cookie auth**), DashboardPage (demo veri), **AccessPage** (`/access` — Kullanıcılar + Roller/izin matrisi, gerçek API), **PersonnelPage** (`/personnel` — Personel + Departman/Kadro sekmeleri; yeniden kullanılabilir `LookupTab`/`LookupFormModal`), **PersonnelDetailPage** (`/personnel/:id` — bilgi kartı + **özlük belgeleri**; `modules/documents/` DocumentSection/DocumentFormModal, multipart upload + indirme), **DefinitionsPage** (`/definitions` — tür-sekmeli tanım/lookup yönetimi; `modules/definitions/` DefinitionTab/DefinitionFormModal; `definitions.view` izinli), **ProductsPage + ProductDetailPage** (`/products`, `/products/:id` — server-side ürün listesi + form modal + **FxCopyButton'lı detay**; `modules/products/`; müşteri & Definition dropdown'ları; `products.view` izinli), **GoodsReceiptsPage + GoodsReceiptDetailPage** (`/goods-receipt`, `/goods-receipt/:id` — server-side mal kabul listesi + başlık formu + **detay: başlık kartı + satırlar tablosu + satır modalı**; `modules/goods-receipts/`; tedarikçi & ürün dropdown'ları; `goodsreceipts.view` izinli), **Stok modülü 3 sayfa** (`/stock` Stok Listesi · `/shelves` Raflar · `/movements` Hareket Detayı; `modules/stock/` — ShelfFormModal/StockMovementFormModal/TransferFormModal; `stock.view`/`shelves.view`), SettingsPage, PlaceholderPage, **fx-debug ShowcasePage**.
- **Loglar (`/logs`):** Serilog "Logs" tablosu (Warning+) görüntüleyici; server-side seviye/arama/tarih filtresi + sayfalama, detay modalında istisna/özellikler. Backend `ILogReader` (ham SQL).
- **Route iskeleti + tam modül haritası:** Menü **operasyon-merkezli** yeniden gruplandı (eski sistemin üst-menü yapısına uyumlu, dropdown'lı): Genel / Operasyon[Tesis, Sevkiyat&Lojistik, Sayım&Saha] / Yönetim[Ürün&Tanımlar, İK, Muhasebe, Belgeler] / Sistem. Eski sistemdeki tüm modüller (mal kabul, stok, raf, octabin, separasyon, sayım, ürün, HACCP, izin, masraf, rapor…) **notlu placeholder** olarak eklendi (`ModuleShell`, açık route, `App.tsx PLACEHOLDER_KEYS`). Detaylı amaç/entity/API planı: **[`MODULES.md`](MODULES.md)**. API tarafında alan bazlı **stub controller'lar** (`Controllers/Stubs/`, 501 + notlu).
- **Bildirimler (`/notifications`):** `Notification` entity (kullanıcı-başına) + `notifications.send` izni; kendi bildirimleri için liste (unreadOnly+sayfalama)/unread-count/okundu/read-all/sil. Header zili ve sayfa gerçek API'de. Diğer modüller olay oluştukça bildirim üretecek (henüz bağlı değil).
- **FxTable server-side modu:** opsiyonel `server` prop'u (arama-debounce/sıralama/sayfalama API'ye); Personnel & Users server-side. Logs kendi server pager'ını kullanıyor.
- **İzin bazlı sidebar:** `UserDto.Permissions` (login/me) → `SessionContext.hasPermission`; nav öğelerinde `permission` + `visibleSections`. Admin tümünü görür.
- **Ön Muhasebe (`/pre-accounting`):** `Account` (cari) + `Transaction` (tek tablo, yön+tür) + enum'lar; bakiye = AçılışBakiyesi + ΣBorç − ΣAlacak (hesaplanır). `AccountsController` (server-side liste + bakiye + CRUD, hareketi olan cari silme koruması) + `TransactionsController` (tahsilat/ödeme; Direction tür'den türetilir). `preaccounting.*` izinleri. Frontend: cari listesi + cari detay (bakiye + hareketler) + modal'lar. `AddPreAccounting` migration uygulandı. Uçtan uca test edildi.
- **Form cilası:** `FxFormError` (kalın başlık + madde listesi), satır içi zorunlu alan doğrulaması, tüm input'larda placeholder + maxLength, TC yalnız rakam. `api/client` artık FormData (`postForm`) + `apiUrl` destekliyor.
- **core:** `api/client.ts` (cookie-auth fetch), `auth/auth-api.ts` (login/logout/me), `auth/SessionContext` (**gerçek; açılışta `me` ile restore + loading splash**), `theme/ThemeContext`, `hooks/useClickOutside`.
- **Auth akışı:** `:5173/api` → vite proxy → `:5137`; uçtan uca test edildi (login→me→logout→401). Giriş: `admin@fxos.local` / `Admin!2345`.
- **Router (react-router):** `main.tsx` BrowserRouter; `App.tsx` `<Routes>`; `core/auth/ProtectedLayout` (auth + AppLayout kabuğu) + `PublicOnlyRoute` (login); rotalar nav key'lerinden üretilir; `AppLayout` Outlet + `useLocation/useNavigate` (Sidebar/Header prop arayüzü değişmedi). `api/client` global **401 interceptor** → oturum düşünce /login. SPA fallback doğrulandı (deep-link/refresh çalışır).
- **Build:** `npm run build` ✅, `npm run lint` ✅ temiz.

## 4. ⚠️ Geçici / Sahte Olanlar (Gerçeğiyle Değişecek)

| Yer | Şu an | Olması gereken |
|-----|-------|----------------|
| `FxTable` | Client-side | Server-side (`PaginationRequest`) modu |
| Dashboard/Notification/Tablo verileri | Statik demo | API'den |
| `AiBubble` | **Sunum için gizlendi** (placeholder; `AppLayout`'ta mount yorumlu) | Gerçek asistan (belirsiz, sonra) — geri açmak için yorumu kaldır |
| Belge depolama | Yerel disk (`App_Data/storage`) | **Cloudflare R2** (kimlik bilgisi gelince `Storage:Provider=r2`) |

> ✅ Auth (SessionContext/LoginPage), `.env` portu (`:5137`), **router (react-router) ve global 401** artık gerçek — bu satırlar tablodan çıkarıldı.
> ✅ **Connection string artık commit'li DEĞİL:** gerçek string gitignore'lı `appsettings.Development.local.json`'da; commit'li `appsettings.json` boş. Design-time factory de bu local override'ı okur. (İleride istenirse user-secrets'e taşınabilir.)

## 5. Nereden Devam? (önerilen sıra)

1. ~~**Faz 1 backend**~~ ✅ **TAMAM** (EF Core+MSSQL, Identity/cookie, Serilog, compression, repo+UoW, exception→Result, migration+seed).
2. ~~**Gerçek auth (Faz 3 başlangıcı)**~~ ✅ **TAMAM** (`AuthController` login/logout/me + frontend `SessionContext`/`LoginPage` bağlandı, uçtan uca test edildi).
3. ~~**Router** + global 401~~ ✅ **TAMAM** (react-router, korumalı rotalar, 401 interceptor).
4. ~~**Permission/yetki** + Identity & Access~~ ✅ **TAMAM** (izin sistemi + Users/Roles CRUD + `/access` ekranları).
5. ~~İlk gerçek iş modülü (**Personnel**)~~ ✅ **TAMAM** (ilk BaseEntity entity'si + Repository/UoW controller + Departman/Kadro lookup'ları + ekranlar; uçtan uca test).
6. ~~**Logging UI**~~ ✅ **TAMAM** (`/logs` — Serilog tablosu görüntüleyici, server-side filtre+sayfalama).
> 🗺️ **Eski sistem domain detayı + detaylı yol haritası** [`MODULES.md`](MODULES.md)'ye işlendi (atık/iade/işlem grupları → DB lookup; ürün alanları; randevu/plaka; sayım takvimi+durum; personel performans; mal kabul adresleme; tesis dashboard düzeni). **Çapraz kararlar:** lookup'lar > hardcode (type-safe FK), tüm detaylara **copy button**, **view-specific placeholder** (mock yok), eski sistemin hatalarını düzelt.

7. ~~Notifications~~ ✅ · ~~FxTable server-side~~ ✅ · ~~izin bazlı sidebar~~ ✅ **TAMAM**.
8. ~~Pre-Accounting (cari)~~ ✅ **TAMAM** (cari + tahsilat/ödeme + bakiye).
9. **Sıradaki geliştirme (kararlaşan akış):** ✅ **FxCopyButton** → ✅ **Tanımlamalar** → ✅ **Ürünler** → ✅ **Mal Kabul** → ✅ **Stok & Raflar** → ✅ **Mal Kabul ↔ Stok entegrasyonu (onay=stok girişi + adresleme)** → ✅ **Octabin (standalone)** → ✅ **Separasyon (standalone)**. **Sıradaki:** build sırası devam (`TODO.md` D2): **Sayım (Counts)** → Sevkiyat/Rota/İrsaliye … *(Geri dönülecek: Ürün Excel içe aktarma; Mal Kabul adresleme analizi raporu; Octabin sevk→stok çıkışı; Separasyon performans panosu.)*
10. **Cepte (yapılacak):** ✅ FxTable preload (skeleton) tamam · **Location'a koordinat** (Latitude/Longitude — lokasyon yönetiminde, kesin) · view-specific placeholder'lar.
11. **Kalanlar:** belge hatırlatma (→ Notifications), R2 devreye alma, gelir/gider (kasa), Logistics alan ekibi + TR lokasyon/koordinat verisiyle.

Detaylı liste: [`TODO.md`](TODO.md).

## 6. Komutlar

```bash
# Backend
dotnet build FxOs.sln

# Frontend
cd frontend
npm install
npm run dev        # geliştirme
npm run build      # tip kontrol + build
npm run lint
```

## 7. Git Durumu

- Private repo, `main` dalı. Faz 0 + frontend Faz 2 commit'leri sıralı, working tree temiz.
- Henüz remote yok (kullanıcı kendi hesabından paylaşım açacak).

## 8. Çalışma Tarzı (hatırlatma)

Cerrah titizliği: hassas, kontrol ederek, her aşamada kullanıcı onayı/checkpoint. Dış bağımlılık minimumda. Her commit'ten önce derleme/lint yeşil olmalı.
