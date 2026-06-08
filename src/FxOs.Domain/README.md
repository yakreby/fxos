# FxOs.Domain

> Çekirdek iş modeli — sistemin kalbi. **Hiçbir katmana bağımlı değildir.**

## Sorumluluk

Saf iş kurallarını ve modelini barındırır. Entity'ler, value object'ler, enum'lar ve domain interface'leri burada tanımlanır. Hiçbir altyapı (EF Core, ASP.NET, dış servis) detayı içermez.

## Bağımlılıklar

```
FxOs.Domain  →  (yok)
```

Dışa bağımlılığı olmaması, iş kurallarını teknolojiden bağımsız ve test edilebilir kılar.

## İçerik Haritası

| Klasör | İçerik |
|--------|--------|
| `Common/` | `BaseEntity` (Guid Id + audit + soft-delete), ortak abstraction'lar |
| `Entities/` | Modül entity'leri (User, Personnel, Waybill, Document, ...) |
| `Enums/` | Domain enum'ları |
| `ValueObjects/` | Değer nesneleri (ileride) |
| `Interfaces/` | Domain seviyesi sözleşmeler (ör. domain servis arayüzleri) |

## Kurallar

- **Tüm entity'ler `BaseEntity`'den türer → Guid PK.** `int id` kullanılmaz.
- Entity ve enum isimleri **İngilizce**.
- Bu projeye **NuGet paketi eklenmez** (saflık korunur).
