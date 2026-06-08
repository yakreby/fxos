namespace FxOs.Storage;

/// <summary>
/// Dosya depolama soyutlaması. Sağlayıcıdan bağımsız (yerel disk veya Cloudflare R2).
/// Anahtarlar (key) sağlayıcı tarafından üretilir; çağıran tarafa opak bir referanstır.
/// </summary>
public interface IFileStorage
{
    /// <summary>Aktif sağlayıcı adı (ör. "local", "r2").</summary>
    string Provider { get; }

    /// <summary>Bir nesneyi kaydeder ve üretilen anahtarı döner.</summary>
    Task<StoredObject> SaveAsync(StorageSaveRequest request, CancellationToken cancellationToken = default);

    /// <summary>Anahtara karşılık gelen içeriği okumak için akış açar; yoksa <c>null</c>.</summary>
    Task<Stream?> OpenReadAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>Anahtara karşılık gelen nesneyi siler (yoksa sessizce geçer).</summary>
    Task DeleteAsync(string key, CancellationToken cancellationToken = default);
}

/// <summary>Kaydedilecek nesnenin içeriği ve meta verisi.</summary>
public sealed class StorageSaveRequest
{
    /// <summary>Okunacak içerik akışı (çağıran kapatır).</summary>
    public required Stream Content { get; init; }

    /// <summary>Orijinal dosya adı (uzantı anahtara eklenir).</summary>
    public required string FileName { get; init; }

    /// <summary>MIME türü.</summary>
    public required string ContentType { get; init; }

    /// <summary>Anahtar ön eki / klasör (ör. "personnel/{guid}"); sonda "/" gerekmez.</summary>
    public string? KeyPrefix { get; init; }
}

/// <summary>Kaydedilen nesnenin sonucu.</summary>
public sealed class StoredObject
{
    public required string Key { get; init; }
    public required string Provider { get; init; }
}
