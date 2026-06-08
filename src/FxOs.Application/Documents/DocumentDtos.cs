using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Documents;

namespace FxOs.Application.Documents;

/// <summary>Belge listesi/detay satırı (dosya meta verisi + süre durumu).</summary>
public sealed class DocumentDto
{
    public Guid Id { get; init; }
    public Guid PersonnelId { get; init; }
    public string Title { get; init; } = string.Empty;
    public DocumentType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public DateTime? IssueDate { get; init; }
    public DateTime? ExpiryDate { get; init; }
    public string? Notes { get; init; }

    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public long FileSizeBytes { get; init; }

    public DateTime CreatedAt { get; init; }

    /// <summary>Son geçerlilik tarihi geçmiş mi?</summary>
    public bool IsExpired { get; init; }

    /// <summary>Son geçerliliğe kalan gün (geçmişse negatif; tarih yoksa null).</summary>
    public int? DaysToExpiry { get; init; }
}

/// <summary>Belge meta verisini güncelleme isteği (dosya değişmez).</summary>
public sealed class UpdateDocumentRequest
{
    [Required(ErrorMessage = "Başlık zorunludur."), MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public DocumentType Type { get; set; } = DocumentType.Other;

    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

/// <summary>Belge türlerinin Türkçe etiketleri (UI ve liste için).</summary>
public static class DocumentTypeLabels
{
    public static string Of(DocumentType type) => type switch
    {
        DocumentType.IdentityCard => "Kimlik Fotokopisi",
        DocumentType.Contract => "İş Sözleşmesi",
        DocumentType.Diploma => "Diploma",
        DocumentType.HealthReport => "Sağlık Raporu",
        DocumentType.CriminalRecord => "Adli Sicil Kaydı",
        DocumentType.ResidenceCertificate => "İkametgah",
        DocumentType.Photo => "Vesikalık Fotoğraf",
        DocumentType.Certificate => "Sertifika",
        DocumentType.Other => "Diğer",
        _ => type.ToString(),
    };
}
