# FxOs.Application

> Uygulama iş mantığı — use-case'lerin yaşadığı katman. Domain'i dış dünyaya bağlar.

## Sorumluluk

İş akışlarını (use-case) yürütür: servisler, DTO'lar, validation, mapping ve **altyapı için interface tanımları**. Implementasyonlar değil, sözleşmeler burada durur (Dependency Inversion).

## Bağımlılıklar

```
FxOs.Application  →  FxOs.Domain, FxOs.Shared
```

> Infrastructure ve Persistence'a **bağımlı değildir.** Onların implement edeceği interface'leri burada tanımlar; bağımlılık tersine çevrilir (DIP).

## İçerik Haritası

| Klasör | İçerik |
|--------|--------|
| `Common/Interfaces/` | Repository, UnitOfWork, dış servis (SMS/Mail/Log) sözleşmeleri |
| `Common/Behaviors/` | Çapraz kesişen davranışlar (validation, logging — ileride) |
| `Modules/` | Modül bazlı servisler & DTO'lar (Identity, Personnel, Dispatch, ...) |
| `Mapping/` | Entity ↔ DTO dönüşümleri |

## Kurallar

- Dış servisler ve veri erişimi **interface üzerinden** kullanılır; somut tipe asla doğrudan bağlanılmaz.
- DTO ↔ Entity ayrımı korunur; entity'ler API'ya sızmaz.
