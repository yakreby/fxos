# FxOs.Infrastructure

> Dış dünya entegrasyonları — SMS, e-posta, loglama ve diğer 3. parti servisler.
> *(Dosya/belge depolama ayrı bir projeye taşındı: [`FxOs.Storage`](../FxOs.Storage/README.md).)*

## Sorumluluk

Application'ın tanımladığı dış servis sözleşmelerini somut teknolojilerle implement eder. Bir bağlantının patlaması durumunda sistemin geri kalanını kilitlememek için **dayanıklı (resilient)** tasarlanır.

## Bağımlılıklar

```
FxOs.Infrastructure  →  FxOs.Application, FxOs.Domain
```

## İçerik Haritası

| Klasör | İçerik |
|--------|--------|
| `Sms/` | NetGSM SMS gönderim implementasyonu |
| `Mail/` | E-posta gönderim & şablonları |
| `Logging/` | Serilog yapılandırması (file + MSSQL sink) |
| `Identity/` | `CurrentUser` (IHttpContextAccessor) vb. |
| `Security/` | Şifreleme, token, helper'lar (ileride) |

## Kurallar

- Her dış servis bir **interface arkasında** durur; Application yalnızca interface'i bilir.
- Hatalar yutulmaz, loglanır ve anlamlı `Result` ile yukarı taşınır.
- Dış bağımlılık minimumda; mümkünse `HttpClient` ile sade entegrasyon.
