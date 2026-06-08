# FxOs.API

> Sunum katmanı (Presentation) ve **Composition Root**. Tüm katmanları birleştirir, dışarıya HTTP açar.

## Sorumluluk

HTTP isteklerini karşılar, kimlik doğrulama/yetkilendirme uygular, DI konteynerini kurar ve istekleri Application servislerine yönlendirir. **İş kuralı içermez.**

## Bağımlılıklar

```
FxOs.API  →  FxOs.Application, FxOs.Infrastructure, FxOs.Persistence
```

## İçerik Haritası

| Klasör / Dosya | İçerik |
|----------------|--------|
| `Program.cs` | Uygulama girişi, servis & middleware pipeline (Composition Root) |
| `Controllers/` | İngilizce isimli controller'lar (ince; işi Application'a devreder) |
| `Middleware/` | Global exception handling, request logging |
| `Extensions/` | DI kayıt extension'ları (`AddApplication`, `AddPersistence`, ...) |
| `Filters/` | Action filter'lar (ileride) |
| `appsettings.json` | Yapılandırma (connection string, cookie, CORS, log) |

## Faz 1'de Buraya Gelecek

- ASP.NET Core Identity + **HttpOnly Cookie** (1 hafta, SlidingExpiration)
- CORS (frontend origin) + `SameSite=None; Secure`
- **Response Compression**
- Serilog request logging + DB/file sink
- Global exception → `Result` dönüşümü
- Swagger (geliştirme)

## Kurallar

- Controller'lar **ince** olur; doğrudan `DbContext` veya iş mantığı barındırmaz.
- Tüm yanıtlar `Result` / `Result<T>` / `PagedResult<T>` zarfıyla döner.
