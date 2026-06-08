# modules

Frontend modülleri — backend modülleriyle birebir eşleşir.

| Modül | Durum |
|-------|-------|
| `dashboard/` | ✅ Genel Bakış (stat kartları + demo tablo) — veriler statik |
| `auth/LoginPage` | ✅ Giriş ekranı — gerçek cookie auth |
| `access/` | ✅ Identity & Access (Kullanıcılar + Roller/izin matrisi) — gerçek API |
| `personnel/` | ✅ Personel + Departman/Kadro + **detay sayfası** (`/personnel/:id`) — gerçek API |
| `documents/` | ✅ `DocumentSection`/`DocumentFormModal` (personel detayında özlük belgeleri); `DocumentListPage`/`DocumentRemindersPage` iskelet |
| `settings/` | ✅ Ayarlar (tema, profil, güvenlik) |
| `common/ModuleShell` | ✅ İçi doldurulmamış modüller için ortak "yapım aşamasında" iskeleti (metinler nav-items'tan) |
| `logistics/` (locations·vehicles·routes), `dispatch/`, `pre-accounting/`, `sms/`, `mail/`, `notifications/`, `logs/` | ⏳ Kendi sayfa dosyası + açık route var; içerik `ModuleShell` (mock data yok) |

Her modül kendi sayfa/ekran ve modül-içi bileşenlerini barındırır; ortak bileşenleri `fx-ui`'den alır. Yeni modül = nav öğesi + sayfa bileşeni + (gerekirse) API servisi.

> Tüm route iskeleti kuruldu; modüller sırayla gerçek ekranlarına kavuşuyor. Logistics & Location bilinçli olarak iskelet (alan ekibi derinleştirecek).
