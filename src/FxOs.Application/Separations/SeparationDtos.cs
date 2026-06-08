using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Separations;

namespace FxOs.Application.Separations;

/// <summary>Separasyon listesi satırı.</summary>
public sealed class SeparationListItemDto
{
    public Guid Id { get; init; }
    public string RequestNumber { get; init; } = string.Empty;
    public DateTime RequestDate { get; init; }
    public SeparationStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public Guid? AssignedPersonnelId { get; init; }
    public string? AssignedPersonnelName { get; init; }
    public string? ProcessTypeName { get; init; }
    public string? WasteTypeName { get; init; }
    public string? Content { get; init; }
    public int? PalletCount { get; init; }
    public decimal? Weight { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Separasyon detayı.</summary>
public sealed class SeparationDetailDto
{
    public Guid Id { get; init; }
    public string RequestNumber { get; init; } = string.Empty;
    public DateTime RequestDate { get; init; }
    public SeparationStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public Guid? AssignedPersonnelId { get; init; }
    public string? AssignedPersonnelName { get; init; }
    public Guid? WasteTypeId { get; init; }
    public string? WasteTypeName { get; init; }
    public Guid? ProcessTypeId { get; init; }
    public string? ProcessTypeName { get; init; }
    public Guid? ResultGroupId { get; init; }
    public string? ResultGroupName { get; init; }
    public Guid? ProductId { get; init; }
    public string? ProductCode { get; init; }
    public string? ProductName { get; init; }
    public Guid? ShelfId { get; init; }
    public string? ShelfCode { get; init; }
    public string? Content { get; init; }
    public int? PalletCount { get; init; }
    public decimal? Weight { get; init; }
    public DateTime? CompletedDate { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>Separasyon oluşturma/güncelleme isteği.</summary>
public sealed class SaveSeparationRequest
{
    /// <summary>Boş bırakılırsa otomatik üretilir.</summary>
    [MaxLength(50)]
    public string? RequestNumber { get; set; }

    [Required(ErrorMessage = "Talep tarihi zorunludur.")]
    public DateTime RequestDate { get; set; }

    public Guid? AssignedPersonnelId { get; set; }

    /// <summary>İçerik — atık tipi (Definition, tür=WasteType; opsiyonel).</summary>
    public Guid? WasteTypeId { get; set; }

    /// <summary>İşlem türü (Definition, tür=ProcessType; opsiyonel).</summary>
    public Guid? ProcessTypeId { get; set; }

    /// <summary>Sonuç grubu — geri kazanım/imha (Definition, tür=WasteGroup; opsiyonel).</summary>
    public Guid? ResultGroupId { get; set; }

    public Guid? ProductId { get; set; }

    public Guid? ShelfId { get; set; }

    [MaxLength(500)]
    public string? Content { get; set; }

    [Range(0, 1_000_000, ErrorMessage = "Palet sayısı negatif olamaz.")]
    public int? PalletCount { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Ağırlık negatif olamaz.")]
    public decimal? Weight { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

/// <summary>SeparationStatus seçeneği (frontend dropdown'ı için).</summary>
public sealed class SeparationStatusOption
{
    public SeparationStatus Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>SeparationStatus değerlerinin Türkçe etiketleri.</summary>
public static class SeparationStatusLabels
{
    public static string Of(SeparationStatus status) => status switch
    {
        SeparationStatus.Pending => "Beklemede",
        SeparationStatus.InProgress => "Ayrıştırılıyor",
        SeparationStatus.Completed => "Tamamlandı",
        SeparationStatus.Cancelled => "İptal",
        _ => status.ToString(),
    };

    public static IReadOnlyList<SeparationStatusOption> All { get; } =
        Enum.GetValues<SeparationStatus>()
            .Select(s => new SeparationStatusOption { Value = s, Label = Of(s) })
            .ToList();
}
