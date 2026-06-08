namespace FxOs.Storage;

/// <summary>
/// Depolama yapılandırması (<c>Storage</c> bölümü). <see cref="Provider"/> hangi
/// sağlayıcının aktif olduğunu belirler ("local" varsayılan; "r2" için R2 alanları dolu olmalı).
/// </summary>
public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    /// <summary>Aktif sağlayıcı: "local" | "r2".</summary>
    public string Provider { get; set; } = "local";

    public LocalStorageOptions Local { get; set; } = new();

    public R2StorageOptions R2 { get; set; } = new();
}

/// <summary>Yerel disk depolama ayarları.</summary>
public sealed class LocalStorageOptions
{
    /// <summary>Kök klasör. Göreli verilirse çalışma dizinine göre çözümlenir.</summary>
    public string RootPath { get; set; } = "App_Data/storage";
}

/// <summary>Cloudflare R2 (S3 uyumlu) ayarları.</summary>
public sealed class R2StorageOptions
{
    /// <summary>S3 uç noktası, ör. https://&lt;accountid&gt;.r2.cloudflarestorage.com</summary>
    public string ServiceUrl { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Bucket { get; set; } = string.Empty;

    /// <summary>Opsiyonel herkese açık taban URL (CDN/özel alan adı); şimdilik kullanılmıyor.</summary>
    public string? PublicBaseUrl { get; set; }
}
