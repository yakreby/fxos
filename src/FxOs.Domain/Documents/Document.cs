using FxOs.Domain.Common;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;

namespace FxOs.Domain.Documents;

/// <summary>
/// Belge kaydı — şimdilik bir personele bağlı (özlük belgeleri). Dosya içeriği
/// <c>IFileStorage</c> ile saklanır; burada yalnızca meta veri + depolama anahtarı tutulur.
/// Süre takibi/hatırlatma için <see cref="ExpiryDate"/> kullanılır.
/// </summary>
public class Document : BaseEntity
{
    /// <summary>Bağlı olduğu personel.</summary>
    public Guid PersonnelId { get; set; }
    public PersonnelEntity Personnel { get; set; } = null!;

    /// <summary>Belge başlığı (ör. "2025 İş Sözleşmesi").</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Belge türü.</summary>
    public DocumentType Type { get; set; } = DocumentType.Other;

    /// <summary>Düzenlenme/veriliş tarihi (opsiyonel).</summary>
    public DateTime? IssueDate { get; set; }

    /// <summary>Son geçerlilik tarihi (opsiyonel; hatırlatma için).</summary>
    public DateTime? ExpiryDate { get; set; }

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }

    // --- Dosya meta verisi ---

    /// <summary>Depolamadaki opak anahtar (IFileStorage tarafından üretilir).</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>Dosyayı tutan sağlayıcı ("local" | "r2").</summary>
    public string StorageProvider { get; set; } = string.Empty;

    /// <summary>Orijinal dosya adı.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>MIME türü.</summary>
    public string ContentType { get; set; } = string.Empty;

    /// <summary>Dosya boyutu (bayt).</summary>
    public long FileSizeBytes { get; set; }
}
