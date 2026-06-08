# FxOs — Yapılacaklar (TODO)

> Son güncelleme: **2026-06-08** (Octabin + Separasyon modülleri standalone tamamlandı; bkz. D2 ve [`MODULES.md`](MODULES.md))
> Öncelik: 🔴 yüksek · 🟡 orta · 🟢 düşük/sonra
> Bağlam için bkz. [`HANDOFF.md`](HANDOFF.md).

---

## A. Backend — Çekirdek Altyapı (Faz 1) ✅ TAMAM

- [x] 🔴 EF Core kurulumu: `Microsoft.EntityFrameworkCore.SqlServer` + `Design` (Persistence; `Design` API'de de — EF tools için).
- [x] 🔴 `FxOsDbContext` (Identity dahil), `appsettings.json` connection string (remote MSSQL: `77.245.159.112 / fxos_`).
- [x] 🔴 `BaseEntity` için soft-delete **global query filter** + audit alanlarını `SaveChanges`'te otomatik doldurma.
- [x] 🔴 ASP.NET Core Identity — **Guid key**'li `ApplicationUser` / `ApplicationRole`; `IdentityDbContext<...,Guid>`.
- [x] 🔴 **Cookie auth**: HttpOnly, `SlidingExpiration`, 1 hafta; API için 401/403 (redirect yok). *(dev `SameSite=Lax`; prod cross-site için `None;Secure` yapılacak.)*
- [x] 🔴 **Serilog**: console + file (rolling, 14 gün) + **MSSQL sink** (`Logs` tablosu, Warning+; `Serilog:EnableMSSqlSink`); request logging; `appsettings`'ten seviye.
- [x] 🟡 **Response compression** (Brotli/Gzip) + `application/json` MIME.
- [x] 🔴 **Generic Repository + UnitOfWork** (Application interface, Persistence impl).
- [x] 🔴 **Global exception handling** middleware → `Result` zarfı (camelCase). **Exception hiyerarşisi:** `FxException` + NotFound(404)/Validation(400)/Conflict(409)/Forbidden(403)/BusinessRule(422); bilinmeyen→500. 401/403 cookie event'leri de `Result` gövdeli. Ortak `ApiResponseWriter`. (notfound/validation/conflict/forbidden/business/500/401/400 uçtan uca test edildi.)
- [x] 🟡 DI extension'ları: `AddApplication()`, `AddPersistence()`, `AddInfrastructure()`.
- [x] 🟡 İlk migration (`InitialCreate`) + `dotnet ef database update` remote DB'ye uygulandı (design-time factory ile).
- [x] 🟢 Seed: ilk admin (`admin@fxos.local` / `Admin!2345`) + roller (`Admin`, `User`) — idempotent, `Seed:*` config.

## B. Backend — Auth & Yetkilendirme (Faz 3)

- [x] 🔴 `AuthController`: `login`, `logout`, `me` (SignInManager, IsActive kontrolü, lockout; uçtan uca test edildi).
- [x] 🔴 **Permission** modeli + rol-izin matrisi; izin-tabanlı policy'ler. `Permissions` kataloğu (const+metadata); permission'lar **rol claim**'i (giriş anında principal'a akar); `HasPermissionAttribute` + `PermissionPolicyProvider` + handler; Admin seed'i tüm izinlere sahip. 403 uçtan uca test edildi.
- [x] 🟡 Kullanıcı/Rol CRUD endpoint'leri: `UsersController` (list paginated/get/create/update/delete), `RolesController` (list/get/create/update/delete, sistem rolü korumalı), `PermissionsController` (katalog). `[HasPermission]` ile korunur.
- [ ] 🟢 **2FA** altyapısı (sonra devreye alınacak).

## C. Frontend — Çekirdeği Tamamlama

- [x] 🔴 Gerçek **router** (**react-router**): auth-korumalı rotalar (`ProtectedLayout`), `PublicOnlyRoute` (login), nav key'lerinden rotalar, deep-link/refresh çalışır. `useState(activeKey)` kaldırıldı; aktif sayfa URL'den türetiliyor.
- [x] 🔴 `SessionContext` + `LoginPage`'i **gerçek cookie auth API'sine** bağla; `me` ile oturum restore (açılış splash + loading state). Port `:5137`'ye hizalandı.
- [x] 🟡 `api/client.ts` global **401 interceptor** → oturum düşünce otomatik /login (auth uçları hariç). Sunucu hatası → `toast` ekran bazında yapılacak.
- [x] 🟡 **FxTable server-side modu** (`PaginationRequest`/`PagedResult`): opsiyonel `server` prop'u (geriye uyumlu); arama (debounce)/sıralama/sayfalama API'ye gider. Personnel & Users listeleri server-side'a taşındı.
- [x] 🟡 Eksik form bileşenleri: **FxInput, FxSelect, FxModal, FxCheckbox, FxTextarea, FxDatePicker** + ortak `FxField` (label/zorunlu/hata/hint). fx-debug showcase'e eklendi.
- [x] 🟡 Form cilası: **FxFormError** (kalın başlık + madde listesi hata özeti), satır içi zorunlu alan doğrulaması, **tüm metin input'larda `placeholder`** (access/cari formları dahil tarandı) + `maxLength`, TC Kimlik yalnız rakam (frontend filtre + backend regex). fx-debug showcase'e eklendi.
- [x] 🟢 Tüm modül **sayfa iskeletleri + açık route yapısı**: her modül kendi sayfa dosyası (mock data yok), generic PlaceholderPage → yeniden kullanılabilir `ModuleShell` (metinler nav-items'tan). Logistics bilinçli iskelet.
- [x] 🟡 **Notification** kalıcı bildirimleri API'ye bağlandı: `Notification` entity + `notifications.send` izni, kendi bildirimleri için liste/unread-count/okundu/read-all/sil; header menüsü ve `/notifications` sayfası gerçek API'de. *(Kalan: diğer modüllerden bildirim üretimi, gerçek-zamanlı/poll.)*
- [x] 🟢 Rol bazlı **sidebar görünürlüğü**: `UserDto.Permissions` (login/me), `SessionContext.hasPermission`, nav öğelerinde `permission` + `visibleSections`. İzinsiz öğeler herkese görünür.
- [ ] 🟢 Büyük logoları optimize et (`fxos-logo.png` 1.6MB, `logo-dark.png` 2.1MB → `.webp`/küçült).
- [ ] 🟢 `index.html` favicon setini gözden geçir (manifest/ms-icon yolları).
- [x] 🟡 **FxTable yükleme iskeleti (preload):** veri gelene kadar animasyonlu skeleton satırları (server modda otomatik, client modda `loading` prop'u).
- [x] 🔴 **FxCopyButton** (yeni fx-ui bileşeni) — değeri panoya kopyalar, kısa süre ✓ onayı (Clipboard API + textarea fallback). `fx-detail-item` içinde hover'da belirir; **Personnel** & **Cari** detaylarındaki `Item`'lara `copy` prop'u ile bağlandı (Ad Soyad/TC/E-posta/Telefon · Vergi No/Telefon/E-posta/Adres). fx-debug showcase'e eklendi. *(Genel `Item`/detay deseni yeni modüller geldikçe aynı prop'la sürdürülecek.)*
- [x] 🟡 **View-specific placeholder'lar:** tüm placeholder modüller artık gerçek düzeni (kart/tablo/takvim/galeri) **veri olmadan** önizliyor. **Kit:** `modules/common/preview/` (`PreviewBanner`, `PreviewTable`, `PreviewCalendar`, `PreviewGallery`, `PreviewCards` — hepsi shimmer iskelet, mock yok). **Spec-driven:** `module-previews.ts` (nav key → kartlar + bölümler) + `ModulePreview`; `ModuleShell` spec varsa zengin önizleme, yoksa generic ekranı gösterir. Bespoke: Tesis Paneli + Masraf Yönetimi. Spec'li: çıkış/octabin/separasyon/randevu(takvim) · sevkiyat/talep/rota/lojistik/irsaliye/lokasyon/araç · sayım(takvim)/saha foto(galeri)/panorama(galeri)/nokta raporu · HACCP · izin/çalışma/personel masraf · belge/hatırlatma/rapor(kart)/SMS/mail. *(Modül gerçeklenince ModuleShell rotası gerçek sayfayla değişir.)*
- [x] 🟡 **Sabit buton/pagination çakışması (UX):** `.fx-content` alt boşluğu (scroll-to-top + AI bubble butonlarının yüksekliği kadar) — uzun tablolarda pagination artık fixed butonların altında kalmıyor.
- [x] 🔴 **Mobil uyumluluk:** sidebar **off-canvas** (≤980px'te soldan kayan drawer + backdrop; `matchMedia` ile masaüstü collapse / mobil drawer ayrımı), responsive header (`fx-hide-mobile` ile fx-debug/Formex gizli, kullanıcı meta ≤560px gizli), stat ızgarası mobilde tek kolon, içerik/header padding ayarı.
- [x] 🟢 **Sidebar iyileştirmeleri:** birden fazla alt menü açıkken **"Tümünü kapat"** tuşu + en altta **© {yıl} Formex** footer.
- [x] 🟢 **Dashboard zenginleştirme:** karşılama başlığı + özet kartları + **Hızlı Erişim** (gerçek modüllere kısayol ızgarası) + **Operasyon Akışı** şeridi (Mal Kabul→Depolama→Sayım→Separasyon→Sevkiyat) + son işlemler/Formex kartı.
- [ ] 🟢 Erişilebilirlik geçişi (focus tuzakları, aria, klavye navigasyonu — özellikle popover/menüler).

## D. İş Modülleri (Faz 4+) — her biri: entity + API + ekran

> 🗺️ **Tam modül/API haritası eklendi:** [`MODULES.md`](MODULES.md). Eski sistemdeki tüm modüller (tesis operasyonu, sevkiyat/lojistik, sayım/saha, ürün/tanım/HACCP, İK izin/çalışma, masraf, rapor) operasyon-merkezli menüye **notlu placeholder** + alan bazlı **stub controller** olarak iskeletlendi. Aşağıdakiler bu haritadan öne çıkanlar.

- [x] 🔴 **Identity & Access** (`/access`) — Kullanıcılar (FxTable + form modal) + Roller (liste + izin matrisi). Backend CRUD + izin denetimi + frontend bağlandı, uçtan uca test edildi.
- [x] 🟡 **Personnel** (`/personnel`) — personel kartı (FxTable + form modal) + Departman & Kadro lookup yönetimi (sekmeli). İlk BaseEntity iş entity'si: generic Repository+UoW kullanan ilk controller, server-side pagination/arama/sıralama/durum filtresi, lookup FK doğrulaması, kullanımdaki lookup silme koruması. Backend uçtan uca test edildi; frontend bağlandı. *(Saha atama → Logistics modülüne ertelendi.)*
- [ ] 🟡 **Logistics & Location** — lokasyonlar, araç/sürücü, rota & sevkiyat (harita ileride).
- [ ] 🟡 **Dispatch (Waybill)** — irsaliye oluştur, durum akışı, PDF, filtre.
- [~] 🟡 **Document** — belge takip. **Başladı:** `FxOs.Storage` (yerel + R2 soyutlaması), `Document` entity + `documents.*` izinleri, upload/indir/güncelle/sil API (20MB + tür allowlist), personel detayında **özlük belgeleri** bölümü (`ExpiryDate` rozetleri). **Kalan:** belge **hatırlatma** (süre dolum → notification), dosya değiştirme (replace), R2'yi devreye alma (kimlik bilgisi bekleniyor), genel Belgeler ekranı.
- [~] 🟢 **PreAccounting** (`/pre-accounting`) — **Başladı:** cari hesaplar (müşteri/tedarikçi) CRUD + cari detay sayfası; tek `Transaction` (yön+tür) ile tahsilat/ödeme; otomatik bakiye (AçılışBakiyesi + ΣBorç − ΣAlacak); `preaccounting.*` izinleri; server-side listeler. Uçtan uca test edildi. **Kalan:** gelir/gider (kasa), ekstre/rapor, dönem filtresi.
- [ ] 🟢 **Sms (NetGSM)** — tekil/toplu gönderim, şablon, geçmiş, teslim durumu. *(NetGSM bilgileri sonra)*
- [ ] 🟢 **Mail** — SMTP gönderim, HTML şablon, kuyruk, geçmiş. *(SMTP bilgileri sonra)*
- [x] 🟢 **Logging UI** (`/logs`) — Serilog "Logs" tablosu (Warning+) görüntüleyici. `ILogReader` (ham SQL, EF modeline sokmadan) + `logs.view`; server-side seviye/arama/tarih filtresi + sayfalama; detay modalında istisna/özellikler. Uçtan uca test edildi. *(Kalan: kaynak/SourceContext filtresi, canlı akış.)*

## D2. Operasyon & İş Modülleri — detaylı iskelet (eski sistemden) 🗺️ [`MODULES.md`](MODULES.md)

> **Önerilen build sırası** (bağımlılık zinciri): **Tanımlamalar → Ürünler → (Lokasyon/Nokta) → Mal Kabul → Stok/Raf → Octabin → Separasyon → Sayım → Sevkiyat/Rota/İrsaliye → Dashboard'lar/Raporlar.** Yatay: İK izin, Masraf, İletişim (SMS/Mail).

- [x] 🔴 **Tanımlamalar (Definitions)** — temel taş **TAMAM**. `Definition` (tek tablo) + `DefinitionType` enum (WasteLocation, WasteType, ReturnGroup, WasteGroup, ProcessType, ProductGroup). Code/Name/IsActive/SortOrder; `DefinitionsController` (`api/definitions` + `/types`, tür içinde ad+kod benzersizliği 409, 400/404) + `definitions.*` izinleri + `DefinitionSeeder` (başlangıç değerleri, idempotent) + `AddDefinitions` migration uygulandı. Frontend: tür-sekmeli `DefinitionsPage` (DefinitionTab/DefinitionFormModal). Uçtan uca test edildi (CRUD + 409/400/404 + seed). Diğer modüller FK ile bağlanacak. *(Eski sistemin serbest-string hatasını FK ile düzeltiyoruz.)*
- [x] 🔴 **Ürünler (Products)** — **TAMAM** (Excel içe aktarma hariç). `Product`: müşteri (Account FK), kod (benzersiz), barkod (benzersiz), ad, net/brüt gramaj, ambalaj türü (enum Adet/Paket/Koli), paket içi/koli içi adet, ürün/iade/atık grubu + işlem türü (**Definition FK — tür-uyumu doğrulanır**), IsActive. `ProductsController` (server-side liste + `/package-types`, FK + tür doğrulama, kod/barkod 409); `products.*` izinleri; `AddProducts` migration uygulandı. Cari dropdown için `AccountsController` `/lookup` ucu eklendi. Frontend: server-side `ProductsPage` + `ProductFormModal` + **`ProductDetailPage` (FxCopyButton'lı)**. Uçtan uca test edildi (CRUD + 409 + tür uyumsuzluğu 400 + 404). *(Kalan: Excel içe aktarma.)*
- [x] 🟡 **Mal Kabul (Goods Receipt)** — **TAMAM (Stok entegrasyonu dahil).** `GoodsReceipt(+Line)`: fiş (otomatik no `MK-yyyyMMdd-####`, tedarikçi Account FK, durum Taslak/Onaylandı/İptal) + satırlar (Product FK, **raf adreslemesi Shelf FK**, miktar, tartım KG, not). **Durum akışı:** Taslak → **Onayla** (her satır için `StockMovement` Giriş/Mal Kabul üretir, satırın rafına; `GoodsReceiptId` ile bağlı, idempotent) → **İptal** (üretilen stok hareketlerini geri alır). Onaylı fişte satır/başlık **kilitli**. `goodsreceipts.*`; `AddGoodsReceipts` + `GoodsReceiptStockLink` migration'ları. Frontend: server-side liste + başlık formu + detay (Onayla/İptal aksiyonları, raf sütunu, FxCopyButton). Uçtan uca test edildi (onay→stok girişi→kilit→iptal→geri alma + idempotent). **Kalan:** Adresleme analizi raporu (sonra).
- [x] 🟡 **Stok & Raflar** — **TAMAM.** `Shelf` (raf, kod benzersiz, kapasite, doluluk hareketlerden) + `StockMovement` ledger (yön Giriş/Çıkış + tür Mal Kabul/Çıkış/Transfer/Düzeltme/Sayım). **Eldeki stok hareketlerden hesaplanır** (Σgiriş−Σçıkış, PreAccounting bakiye deseni); ayrı senkron tablo yok. `ShelvesController` (CRUD + doluluk, kod 409, kullanımdaki raf silme 422) + `StockController` (`/meta`, current stok, `/movements` server-side ledger, manuel hareket, `/transfer` = kaynak çıkış+hedef giriş, hareket sil). `shelves.*` + `stock.*` izinleri; `AddStock` migration uygulandı. Frontend: 3 sayfa (Stok Listesi / Raflar / Hareket Detayı) + modal'lar. Uçtan uca test edildi (giriş/çıkış/transfer matematiği + doluluk + 409/422/400). *(Boş raf listesi = doluluk 0 olanlar; ayrı rapor sonra.)*
- [x] 🟡 **Octabin** — **TAMAM (standalone).** `Octabin` (tek tablo, satırsız) + `OctabinStatus` enum (Açık/Dolu/Sevk Edildi). İçerik **esnek**: atık tipi (Definition FK, tür=WasteType, tür-uyumu doğrulanır) ve/veya ürün (Product FK) ve/veya serbest metin; raf/lokasyon (Shelf FK, opsiyonel); kapasite/net ağırlık → **doluluk %** (DTO'da hesaplanır). Otomatik no `OCT-yyyyMMdd-####`. **Durum akışı:** Açık → **Kapat** (Dolu) → **Sevk Et**; **Yeniden Aç** (Dolu→Açık) düzeltme için; sevk edilen kilitli. `OctabinsController` (`api/octabins` + `/statuses`, server-side liste + status filtre, CRUD, `{id}/close`, `{id}/reopen`, `{id}/dispatch`); `octabins.*` izinleri; `AddOctabin` migration uygulandı. Frontend: server-side `OctabinsPage` + `OctabinFormModal` + `OctabinDetailPage` (durum aksiyonları + FxCopyButton). Build/lint yeşil. **Kalan:** sevk → stok çıkışı entegrasyonu (sonra); octabin raporu.
- [x] 🟡 **Separasyon** — **TAMAM (standalone).** `SeparationRequest` (tek tablo) + `SeparationStatus` enum (Beklemede/Ayrıştırılıyor/Tamamlandı/İptal). İçerik/işlem/sonuç **Definition FK** (tür-uyumu doğrulanır): `WasteTypeId` (WasteType), `ProcessTypeId` (ProcessType), `ResultGroupId` (WasteGroup, geri kazanım/imha); ayrıca `AssignedPersonnelId` (**işlem personele damgalanır** — performans), `ProductId`, `ShelfId`, serbest `Content`, `PalletCount`, `Weight`. Otomatik no `SEP-yyyyMMdd-####`. **Durum akışı:** Başlat (Beklemede→Ayrıştırılıyor) → Tamamla (→Tamamlandı); Yeniden Aç (Tamamlandı→Ayrıştırılıyor); İptal (tamamlanmamış). Tamamlanan/iptal kilitli. `SeparationsController` (`api/separations` + `/statuses`, server-side liste + status filtre, CRUD, `{id}/start|complete|reopen|cancel`); `separations.*` izinleri; **Personnel `/lookup` ucu eklendi** (aktif personel dropdown'ı); `AddSeparation` migration uygulandı. Frontend: server-side `SeparationsPage` + `SeparationFormModal` + `SeparationDetailPage` (durum aksiyonları + FxCopyButton). Build/lint yeşil. **Kalan:** `PersonnelActivity` performans panosu (ayrı modül).
- [ ] 🟡 **Sayım (Counts)** — takvim görünümü + durum (BEKLEMEDE/SAYILIYOR/SAYILDI); WasteLocation/WasteType (Definition FK). Saha fotoğrafları, panorama, nokta/zincir raporları.
- [ ] 🟡 **Sevkiyat & Lojistik** — `Shipment`, `ShipmentRequest`, `Route(+Stop)`, `LogisticsMovement`, `Waybill` (irsaliye + durum + PDF), `Location` (nokta — **`Latitude`/`Longitude` koordinat dahil**, harita için), `Vehicle` (sürücü=Personnel FK).
- [ ] 🟡 **Randevular** — `Appointment`: tarih, ad soyad, firma, kimlik no, **plaka**, giriş/çıkış saati, not.
- [ ] 🟡 **Tesis Dashboard** — kart/liste düzeni (günlük mal kabul adet+KG, son kabuller, raf/palet doluluk, separasyon detay). View-specific.
- [ ] 🟡 **Personel Performans/İşlem Geçmişi** — `PersonnelActivity` + analiz panosu (Top 5).
- [ ] 🟢 **Masraf Yönetimi / Personel Masrafı**, **İzin Yönetimi**, **Çalışma Raporu**, **HACCP**, **Rapor Merkezi**, **SMS/Mail**.

## E. Operasyonel / DevOps

- [ ] 🟡 Remote repo (kullanıcının hesabı) + branch/PR akışı.
- [ ] 🟢 CI: backend `dotnet build/test`, frontend `lint + build`.
- [ ] 🟢 Deployment: frontend Vercel; backend + MSSQL gerçek sunucu; ortam değişkenleri/secrets.
- [ ] 🟢 Backend test projesi (unit/integration) iskeleti.

## G. Yeni Yön & Kalite (2026-06-08 oturumu)

> Kullanıcı isteği. Hızlı düzeltmeler uygulandı; büyük modüller önceliklendirilecek.

**Uygulanan hızlı düzeltmeler (✅):**
- [x] 🟢 Dashboard: başlık **"Formex Yönetim Paneli"**, sistemle ilgili alt başlık (döngü özeti + kullanıcı selamı), **"Hızlı Erişim Menüsü"**.
- [x] 🟢 Loglar başlığı → **"Sistem Kayıtları · Loglar"**.
- [x] 🟢 Mobil: `.fx-content` padding **1rem** + sayfa başına üst nefes payı (`--fx-space-5` tanımsız bug'ı düzeltildi — gerçekte 32px kalıyordu).
- [x] 🟢 Mobil bildirim menüsü: viewport sağ kenarına sabitlendi (zil ortada kaldığı için soldan açılıyordu) — `fx-notif-popover`.

**Büyük modüller (önceliklendirilecek):**
- [x] 🟡 **Excel/PDF dışa aktarma** — **ALTYAPI TAMAM + 3 modül bağlı.** Biçimden bağımsız `ExportTable` modeli + `IExportService` → `ExportService` (**CSV** yerleşik UTF-8 BOM/`;`; **Excel** ClosedXML; **PDF** QuestPDF). `IExportService` singleton. Ortak `ExportHelpers` (format parse, tarih aralığı etiketi, gün-sonu, tr-TR biçim). Controller `GET export` ucu (`from`/`to`/`status`/`format`) → `File(...)`. **Bağlı modüller:** Mal Kabul, Octabin, Separasyon. Frontend: yeniden kullanılabilir `modules/common/ExportButton` (tarih aralığı + format modalı) + `downloadFile` helper (blob + Content-Disposition'dan ad). Uçtan uca test: PDF/Excel/CSV 200 + doğru MIME. **Kalan:** diğer listelere ekle (Ürün, Stok hareketleri, Cari, Personel); **⚠️ QuestPDF Community lisansı** ticari kullanımda <$1M ciro şartı — Formex aşıyorsa lisans/PDFsharp'a geçiş (IExportService arkasında izole).
- [ ] 🟡 **Dijital Tesis** (yeni sayfa) — **harita** üzerinde Formex toplama noktaları + tesis(ler); **İstanbul genel merkez**. Hiyerarşik drill-down (merkez → departmanlar). Tek arayüzden tüm operasyon görünümü. *(Lokasyon `Latitude`/`Longitude` ile bağlanır; Logistics/Location modülüyle kesişir.)*
- [ ] 🟡 **İK genişletme** — **CV havuzu** + **iş başvuruları** (başvuru formu/yönetimi); sonra **siteye bağlama** (public başvuru). Personnel modülünün üstüne.
- [ ] 🟡 **İSG Yönetimi** (yeni başlık) — iş sağlığı & güvenliği: eğitim/kaza/risk kayıtları, belge takibi. *(Detay netleştirilecek.)*

## F. Beklenen Bilgiler (kullanıcıdan)

- [x] 🔴 ~~Geçici uzak **MSSQL connection string**~~ — alındı (`77.245.159.112 / fxos_`); şema uygulandı. *(İleride user-secrets'e taşı.)*
- [ ] 🔴 **Cloudflare R2** kimlik bilgileri (ServiceUrl/AccessKey/SecretKey/Bucket) — belge depolamayı R2'ye almak için (şimdilik yerel disk aktif).
- [ ] 🟢 **NetGSM** API bilgileri (SMS modülü için).
- [ ] 🟢 **SMTP** bilgileri (Mail modülü için).
- [ ] 🟢 Gerçek **API portu** (frontend `.env` proxy hedefi güncellenecek).

---

### Not
Yeni `fx-ui` bileşeni eklenince **fx-debug showcase**'e örnek bölümü eklenmeli. Her commit öncesi backend `dotnet build`, frontend `npm run build` + `npm run lint` yeşil olmalı.
