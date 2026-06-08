# FxOs.Persistence

> Veri erişim katmanı — EF Core, MSSQL, repository implementasyonları ve migration'lar.

## Sorumluluk

Application'ın tanımladığı veri erişim sözleşmelerini (Repository, UnitOfWork) **EF Core ile MSSQL üzerinde** implement eder. `DbContext`, entity configuration'ları ve migration'lar burada yaşar.

## Bağımlılıklar

```
FxOs.Persistence  →  FxOs.Application, FxOs.Domain
```

Eklenecek paketler (Faz 1): `Microsoft.EntityFrameworkCore.SqlServer`, `...Tools`, `...Design`.

## İçerik Haritası

| Klasör | İçerik |
|--------|--------|
| `Context/` | `FxOsDbContext` (Identity dahil) |
| `Configurations/` | `IEntityTypeConfiguration<T>` ile Fluent API eşlemeleri |
| `Repositories/` | Generic + modül repository implementasyonları |
| `Migrations/` | EF Core code-first migration'ları (repoda tutulur) |
| `Seed/` | Başlangıç verileri (rol, admin, ...) |

## Kurallar

- Tüm Guid PK'ler ve audit alanları `BaseEntity` üzerinden gelir.
- Soft-delete global query filter ile uygulanır.
- Migration'lar `dotnet ef` ile bu projede üretilir, startup projesi `FxOs.API`'dir.
