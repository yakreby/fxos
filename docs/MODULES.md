# FxOs — Modül & API Haritası

> Son güncelleme: **2026-06-08**
> Bu doküman tüm modüllerin **amacını**, **planlanan entity'lerini** ve **API uçlarını** notlar.
> Durum: ✅ gerçek (uçtan uca) · 🟡 kısmi · ⏳ iskelet (placeholder + not).
> Frontend route'ları `App.tsx`'te, menü/açıklamalar `layout/nav-items.ts`'te.
> Yeni modül deseni: Domain entity → EF config → Application DTO → Controller (`[HasPermission]`) → migration → frontend sayfa.

İş bağlamı: Formex zero-waste tesis operasyonu. Akış: **Mal Kabul → depolama (raf/octabin) → sayım/saha → separasyon → çıkış/sevkiyat (rota/irsaliye)**; yanında Ürün, Nokta/Lokasyon, HACCP, Evrak, İK, Muhasebe, Raporlar.

---

## Genel
- **Dashboard** ✅ — Genel bakış (şimdilik demo veri; modüller bağlandıkça gerçek özet).

---

## Operasyon

### Tesis Yönetimi (`api/facility`) ⏳
Tesis içi stok ve hareket operasyonu.
- **Tesis Paneli (Dashboard)** — **kart/blok düzeni (tablo değil)**: günlük mal kabul (adet + toplam KG), son kabuller listesi (kod, tarih, paket x/y, KG, müşteri rozeti), raf/palet doluluk (depo bazlı: KT1/KT2 boş raf + palet x/y + tonaj dağılımı), separasyon palet sayısı, separasyon işlem detayları (personel/makine). Çoğu kart diğer modüllerin verisinden türetilir.
- **Mal Kabul** ✅ — entity `GoodsReceipt` (+ `GoodsReceiptLine`): gelen ürün kabulü, tartım (KG), **raf adreslemesi** (Line.ShelfId). Fiş (otomatik no, tedarikçi Account FK, durum enum) + satırlar (Product FK, Shelf FK, miktar, tartım, not). **Stok entegrasyonu:** `{id}/confirm` → satırlar için `StockMovement` (Giriş/Mal Kabul, rafa) üretir (`GoodsReceiptId` bağı, idempotent); `{id}/cancel` → hareketleri geri alır; onaylı fişte düzenleme kilitli. `api/goods-receipts` (+`/statuses`, server-side liste, başlık CRUD, `{id}/lines` ekle, `lines/{lineId}` sil, `{id}/confirm`, `{id}/cancel`). `goodsreceipts.*`. **Kalan:** Adresleme analizi raporu (toplam/adreslenen/adreslenmeyen/oran/günlük).
- **Çıkışlar** — entity `OutboundEntry`: tesisten çıkış, sevkiyata bağlama, stok düşümü.
- **Stok Listesi** ✅ — **hareketlerden türetilen görünüm** (ayrı StockItem tablosu yok): ürün bazında eldeki miktar/KG (Σgiriş−Σçıkış). `GET api/stock` (filtre: shelfId, search). `stock.view`.
- **Raflar** ✅ — `Shelf`: kod (benzersiz)/ad/kapasite + **doluluk** (hareketlerden: miktar/KG/ürün çeşidi). `api/shelves` CRUD; kullanımdaki raf silinemez (422). `shelves.*`. *(Boş raf = doluluk 0.)*
- **Hareket Detayı** ✅ — `StockMovement` ledger (yön Giriş/Çıkış + tür Mal Kabul/Çıkış/Transfer/Düzeltme/Sayım, raf/referans/not). `api/stock/movements` (server-side liste, ekle, sil) + `api/stock/transfer` (kaynak çıkış+hedef giriş) + `api/stock/meta`. `stock.*`.
- **Octabin Yönetimi** ✅ — `Octabin` (tek tablo): açma/kapama, içerik, sevk. `OctabinStatus` enum (Açık/Dolu/Sevk Edildi). İçerik esnek: `WasteTypeId` (Definition FK, tür=WasteType) ve/veya `ProductId` (Product FK) ve/veya `Content` (serbest); `ShelfId` (lokasyon); `Capacity`/`NetWeight` → doluluk %. Otomatik no `OCT-yyyyMMdd-####`. Durum akışı: `{id}/close` (Açık→Dolu), `{id}/reopen` (Dolu→Açık), `{id}/dispatch` (Dolu→Sevk Edildi); sevk edilen kilitli. `api/octabins` (+`/statuses`, server-side liste, CRUD). `octabins.*`. **Kalan:** sevk→stok çıkışı entegrasyonu; octabin raporu.
- **Separasyon** ✅ — `SeparationRequest` (tek tablo): ayrıştırma talebi + durum akışı (geri kazanım/imha). `SeparationStatus` enum (Beklemede/Ayrıştırılıyor/Tamamlandı/İptal). İçerik/işlem/sonuç **Definition FK** (tür-uyumu): `WasteTypeId`/`ProcessTypeId`/`ResultGroupId`; `AssignedPersonnelId` (**işlem personele damgalanır** → performans), `ProductId`, `ShelfId`, `Content`, `PalletCount`, `Weight`. Otomatik no `SEP-yyyyMMdd-####`. Durum akışı: `{id}/start|complete|reopen|cancel`. `api/separations` (+`/statuses`, server-side liste, CRUD). `separations.*`. *(Personnel `/lookup` ucu bu modülle eklendi.)* **Kalan:** performans panosu (`PersonnelActivity`).
- **Randevular** — `Appointment` (araç/mal kabul randevusu): `Date`, `FullName`, `CompanyName`, `NationalId`, **`Plate` (plaka)**, `EntryTime` (giriş saati), `ExitTime` (çıkış saati), `Note`. Takvim + mal kabul tablosu görünümü.

### Sevkiyat & Lojistik (`api/shipment`, `api/logistics`) ⏳
- **Sevkiyat Planlama** — `Shipment`: oluştur, araç/rota atama, yük planı.
- **Talepler** — `ShipmentRequest`: yeni talep + onay akışı.
- **Rota Planlama / Rota Listesi** — `Route` (+ `RouteStop`): rota oluştur, nokta sıralama, durum, maliyet. (Harita ileride.)
- **Lojistik Hareketleri** — `LogisticsMovement`: araç/sürücü bazlı hareket kayıtları.
- **İrsaliyeler** — `Waybill`: oluştur, durum (yolda/teslim), PDF, Univera karşılaştırma.
- **Lokasyonlar / Noktalar** — `Location`: toplama noktaları/tesisler; bölge/il; **`Latitude`/`Longitude` koordinat (kesin gereksinim — lokasyon yönetiminde harita/konum için)**. *(Alan ekibi derinleştirecek; TR lokasyon listesi + koordinat verisi bekleniyor.)*
- **Araç & Sürücüler** — `Vehicle` (+ sürücü = `Personnel` FK): araç kartı, sürücü atama, bakım.

### Sayım & Saha (`api/counting`) ⏳
- **Sayım Paneli** — özet/tamamlanma oranları (durum dağılımı).
- **Sayımlar** — `Count` (+ `CountLine`): **takvim görünümü** (aylık); durum `CountStatus` enum: **BEKLEMEDE / SAYILIYOR / SAYILDI** (Pending/InProgress/Counted); `WasteLocation` & `WasteType` (Definition FK) ile ilişkili; planlanan tarih. Liste + yeni sayım + güncelleme (yönetici modu).
- **Saha Fotoğrafları** — `FieldPhoto` (IFileStorage ile dosya): arşiv, noktaya göre filtre.
- **Panorama** — `Panorama`: nokta panorama görüntüleri.
- **Nokta & Zincir Raporları** — sayım verisinden türetilen raporlar (nokta/zincir), dışa aktarma.

---

## Yönetim

### Ürün & Tanımlar ⏳
- **Tanımlamalar** (`api/definitions`) ✅ — **type-safe lookup yönetimi** (eski sistemin "defType" deseni: WASTELOC/WASTETYPE). Tek `Definition` entity + `DefinitionType` enum ayraç + `Code?`, `Name`, `IsActive`, `SortOrder`. Türler:
  - `WasteLocation` (atık lokasyonu/nokta): ör. İzmir Depo, İzaydaş, AGT Atık, Fazla Gıda…
  - `WasteType` (atık tipi): ör. OKTABİN, PALET-150103, GENEL-YEM HAMMADDE…
  - `ReturnGroup` (iade grubu): BİYOYAKIT-KATI, BİYOYAKIT-SIVI, YEM KATKI MADDESİ, İMHA-CAM, İMHA-PLASTİK, İMHA-METAL
  - `WasteGroup` (atık grubu): GERİ KAZANIM-KATI, GERİ KAZANIM-SIVI, YEM KATKI MADDESİ
  - `ProcessType` (işlem türü): BİYOYAKIT, YEM KATKI MADDESİ, KAPSAM DIŞI, ENDÜSTRİYEL
  - `ProductGroup` (ürün grubu)

  Başlangıç değerleri **seed** ile gelir (idempotent `DefinitionSeeder`); UI'dan yönetilebilir (tür-sekmeli ekran). Diğer modüller bunlara **FK** ile bağlanır (join/include stabilitesi). *(Sabit kümeler — paket tipi, durumlar — enum kalır.)* **Uçlar:** `GET /types`, `GET ?type=`, `POST`, `PUT/{id}`, `DELETE/{id}` (tür içinde ad+kod benzersizliği). `definitions.*` izinleri.
- **Ürünler** (`api/products`) ✅ — `Product`: `Customer` (Account FK / müşteri), `ProductCode` (benzersiz), `Barcode` (benzersiz), `Name`, `NetWeight` (gramaj), `GrossWeight` (brüt gramaj), `PackageType` **enum** (Adet/Paket/Koli), `UnitsPerPackage` (paket içi), `UnitsPerCase` (koli içi), `ProductGroupId` · `ReturnGroupId` · `WasteGroupId` · `ProcessTypeId` (**Definition FK**'leri — yazarken tür-uyumu doğrulanır), `IsActive`. **Uçlar:** `GET /package-types`, `GET` (server-side liste, customerId filtresi), `GET/{id}`, `POST`, `PUT/{id}`, `DELETE/{id}`. `products.*` izinleri. Frontend: server-side liste + form + FxCopyButton'lı detay. *(Kalan: Excel içe aktarma. Not: spec'teki belirsiz `Package` alanı dahil edilmedi; paket içi/koli içi yeterli.)*
- **HACCP** (`api/haccp`) — `HaccpControlPoint` + `HaccpRecord`: kontrol noktaları, kayıtlar, uygunsuzluk takibi.

### İnsan Kaynakları (`api/hr`)
- **Personel** ✅ — `Personnel` + Department/Position lookup + özlük belgeleri (Document). `personnel.*` izinleri.
- **İzin Yönetimi** ⏳ — `LeaveRequest`: talep, onay akışı, izin bakiyesi (Personnel FK).
- **Çalışma Raporu** ⏳ — `WorkLog` / mesai kayıtları, dönem raporu.
- **Personel İşlem Geçmişi & Performans** ⏳ — `PersonnelActivity` (kim/ne/ne zaman — separasyon vb. işlemler personele damgalanır). Performans raporu: tarih aralığı + analiz panosu (işlem türüne göre Top 5, personele göre işlem sayısı Top 5). Operasyon modülleri işlem yaparken bu log'u besler.

### Muhasebe (`api/preaccounting`, `api/expenses`)
- **Cari Hesaplar** ✅ — `Account` (cari) + `Transaction` (tahsilat/ödeme, yön+tür) + otomatik bakiye. `preaccounting.*`.
- **Masraf Yönetimi** ⏳ — `Expense`: masraf kaydı, kategori, onay/rapor.
- **Personel Masrafları** ⏳ — `PersonnelExpense`: personel bazlı masraf/avans/mahsup (Personnel FK).

### Belgeler (`api/documents`, `api/personnel/{id}/documents`)
- **Belgeler** 🟡 — `Document` entity + `FxOs.Storage` (yerel/R2). Şu an özlük belgeleri personel detayında. Genel belge arşivi ekranı ⏳. `documents.*`.
- **Hatırlatmalar** ⏳ — `Document.ExpiryDate` üzerinden süre dolum → **Notification** üretimi (zamanlanmış iş).

---

## Sistem
- **Rapor Merkezi** (`api/reports`) ⏳ — modüller arası rapor şablonları, Excel/PDF dışa aktarma, zamanlanmış rapor.
- **Bildirimler** ✅ — `Notification` (kullanıcı-başına). Diğer modüller olay oluştukça üretir. `notifications.send`.
- **İletişim** ⏳ — **SMS** (NetGSM) ve **E-posta** (SMTP): tekil/toplu gönderim, şablon, geçmiş. *(Sağlayıcı bilgileri bekleniyor.)*
- **Loglar** ✅ — Serilog "Logs" tablosu görüntüleyici (`ILogReader`). `logs.view`.
- **Roller & İzinler** ✅ — Kullanıcı/Rol/İzin matrisi. `users.*`/`roles.*`.

---

## Dışa Aktarma (Excel/PDF/CSV) — yatay altyapı ✅

Biçimden bağımsız `ExportTable` (başlık + sütunlar + satırlar) → `IExportService` → `ExportService`: **CSV** (yerleşik, UTF-8 BOM + `;` ayraç, Excel-TR uyumlu), **Excel** (ClosedXML `.xlsx`), **PDF** (QuestPDF, A4 yatay tablo). Controller'larda `GET <modül>/export?from&to&status&format` → tarih aralıklı sorgu → `File(...)`. Ortak `API/Common/ExportHelpers` (format parse, `dd.MM.yyyy`/`#,##0.###` tr-TR biçim, gün-sonu, tarih etiketi). Frontend: `modules/common/ExportButton` (tarih aralığı + format modalı) + `core/api/client` `downloadFile` (cookie-auth blob + Content-Disposition'dan dosya adı). **Bağlı:** Mal Kabul, Octabin, Separasyon. *(Sıradaki listelere aynı desenle eklenecek.)* **⚠️ QuestPDF Community lisansı:** ticari kullanımda ciro şartı; gerekirse `IExportService` arkasından PDFsharp'a geçilebilir.

---

## Çapraz Kararlar (UX & Veri)

> Eski sistemin hatalarını düzeltip daha iyisini yapmak ana hedef. Bu ilkeler tüm modüllerde geçerli.

- **Lookup'lar > hardcode (type-safe):** İş tarafından değişebilen grup/tip listeleri (iade/atık/işlem grubu, atık lokasyon/tip, ürün grubu) **DB'de `Definition`** olarak tutulur ve FK ile bağlanır — string yerine ilişki; join/include stabil, yönetilebilir. **Sabit** kümeler (paket tipi adet/paket/koli, durumlar) **enum**. (Eski sistemde serbest string'di → tutarsızlık; biz FK ile düzeltiyoruz.)
- **Copy button:** ✅ Tüm **detay view'larında** alan değerlerinin yanında hızlı kopyalama (`FxCopyButton` — fx-ui bileşeni; ✓ onayı + Clipboard fallback, `fx-detail-item` hover'da belirir). Personnel & Cari bağlandı; yeni modüller `Item`'a `copy` prop'u ile sürdürür. İş hızını artırır.
- **View-specific placeholder:** Henüz veri gelmeyen modüllerde generic "yakında" yerine **her view'ın gerçek düzenini** (dashboard kartları, liste kolon başlıkları, takvim ızgarası) **veri olmadan** önizleyen iskelet. **Mock data yok**; sadece yapı/amaç görünür. (`ModuleShell` genel placeholder olarak kalır; öne çıkan view'lar kendi iskeletini alır.)
- **Tablo preload:** ✅ `FxTable` yüklenirken animasyonlu skeleton satırları gösterir (veri yazılmadan önce); server modda otomatik, client modda `loading` prop'u ile.
- **Para/ağırlık:** decimal(18,2/3); KG ve tutarlar tutarlı biçimlendirme (tr-TR).

## Notlar
- **İzinler:** Her gerçek modül `<modül>.view/create/update/delete` izin grubu ekler (`Application/Common/Authorization/Permissions.cs`); placeholder modüller izinsiz (herkese görünür) — gerçeklenince izin + `nav-items` `permission` eklenir.
- **Stub controller'lar:** `api/facility`, `api/shipment`, `api/counting`, `api/hr`, `api/expenses`, `api/reports` — şimdilik 501 (NotImplemented) döner; XML-doc'larında planlanan uçlar notludur. *(`api/products` artık gerçek modül.)*
- **Dosyalar:** Yüklenen dosyalar `IFileStorage` (yerel disk; R2 hazır, kimlik bilgisi bekleniyor).
