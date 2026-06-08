# FxOs.Storage

> Sağlayıcıdan bağımsız dosya/belge depolama soyutlaması — yerel disk + Cloudflare R2.

## Sorumluluk

Dosya yükleme/okuma/silme işlemlerini tek bir sözleşme (`IFileStorage`) arkasında toplar. Aktif sağlayıcı `Storage:Provider` config değeriyle seçilir; çağıran kod hangi sağlayıcının kullanıldığını bilmez.

## Bağımlılıklar

```
FxOs.Storage  →  (yalnızca) AWSSDK.S3  +  Extensions soyutlamaları (DI/Options/Config)
```

Domain/Application'a bağımlı değildir; API doğrudan referans verir (controller'lar `IFileStorage` enjekte eder).

## İçerik Haritası

| Dosya | İçerik |
|-------|--------|
| `IFileStorage.cs` | Sözleşme + `StorageSaveRequest` / `StoredObject` |
| `StorageOptions.cs` | `Storage` config bölümü (Provider · Local · R2) |
| `StorageKey.cs` | Guid tabanlı anahtar üretimi |
| `Local/LocalFileStorage.cs` | Yerel disk (varsayılan); path-traversal korumalı |
| `R2/R2FileStorage.cs` | Cloudflare R2 (S3 uyumlu, `AWSSDK.S3`) |
| `DependencyInjection.cs` | `AddStorage()` — config'e göre sağlayıcı seçimi |

## Kurallar

- Anahtarlar (key) opaktır ve sağlayıcı üretir; orijinal dosya adı çağıran tarafta (DB meta verisinde) saklanır.
- Tür/boyut doğrulaması çağıran (controller) sorumluluğundadır; depolama katmanı içerikle ilgilenmez.
- R2 kimlik bilgileri tanımlanana kadar **yerel sağlayıcı** aktiftir (`Storage:Provider=local`).
