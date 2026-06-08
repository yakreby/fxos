using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Octabins;

namespace FxOs.Application.Octabins;

/// <summary>Octabin listesi satırı (özetlerle).</summary>
public sealed class OctabinListItemDto
{
    public Guid Id { get; init; }
    public string OctabinNumber { get; init; } = string.Empty;
    public OctabinStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public string? WasteTypeName { get; init; }
    public string? ProductCode { get; init; }
    public string? ProductName { get; init; }
    public string? Content { get; init; }
    public string? ShelfCode { get; init; }
    public decimal? Capacity { get; init; }
    public decimal? NetWeight { get; init; }
    /// <summary>Doluluk yüzdesi (NetWeight / Capacity); kapasite yoksa null.</summary>
    public decimal? FillPercent { get; init; }
    public DateTime OpenedDate { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Octabin detayı.</summary>
public sealed class OctabinDetailDto
{
    public Guid Id { get; init; }
    public string OctabinNumber { get; init; } = string.Empty;
    public OctabinStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public Guid? WasteTypeId { get; init; }
    public string? WasteTypeName { get; init; }
    public Guid? ProductId { get; init; }
    public string? ProductCode { get; init; }
    public string? ProductName { get; init; }
    public string? Content { get; init; }
    public Guid? ShelfId { get; init; }
    public string? ShelfCode { get; init; }
    public decimal? Capacity { get; init; }
    public decimal? NetWeight { get; init; }
    public decimal? FillPercent { get; init; }
    public DateTime OpenedDate { get; init; }
    public DateTime? ClosedDate { get; init; }
    public DateTime? DispatchedDate { get; init; }
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>Octabin oluşturma/güncelleme isteği.</summary>
public sealed class SaveOctabinRequest
{
    /// <summary>Boş bırakılırsa otomatik üretilir.</summary>
    [MaxLength(50)]
    public string? OctabinNumber { get; set; }

    [Required(ErrorMessage = "Açılış tarihi zorunludur.")]
    public DateTime OpenedDate { get; set; }

    /// <summary>İçerik — atık tipi (Definition, tür=WasteType; opsiyonel).</summary>
    public Guid? WasteTypeId { get; set; }

    /// <summary>İçerik — ürün (opsiyonel).</summary>
    public Guid? ProductId { get; set; }

    [MaxLength(500)]
    public string? Content { get; set; }

    public Guid? ShelfId { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Kapasite negatif olamaz.")]
    public decimal? Capacity { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Ağırlık negatif olamaz.")]
    public decimal? NetWeight { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

/// <summary>OctabinStatus seçeneği (frontend dropdown'ı için).</summary>
public sealed class OctabinStatusOption
{
    public OctabinStatus Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>OctabinStatus değerlerinin Türkçe etiketleri.</summary>
public static class OctabinStatusLabels
{
    public static string Of(OctabinStatus status) => status switch
    {
        OctabinStatus.Open => "Açık",
        OctabinStatus.Full => "Dolu",
        OctabinStatus.Dispatched => "Sevk Edildi",
        _ => status.ToString(),
    };

    public static IReadOnlyList<OctabinStatusOption> All { get; } =
        Enum.GetValues<OctabinStatus>()
            .Select(s => new OctabinStatusOption { Value = s, Label = Of(s) })
            .ToList();
}
