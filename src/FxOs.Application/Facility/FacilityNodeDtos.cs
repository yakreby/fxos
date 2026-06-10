using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Facility;

namespace FxOs.Application.Facility;

/// <summary>Harita düğümü (liste + detay; küçük olduğu için tek DTO).</summary>
public sealed class FacilityNodeDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string City { get; init; } = string.Empty;
    public FacilityNodeType NodeType { get; init; }
    public string NodeTypeLabel { get; init; } = string.Empty;
    public FacilityNodeStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public double Latitude { get; init; }
    public double Longitude { get; init; }
    public string? Description { get; init; }
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>Harita düğümü oluşturma/güncelleme isteği.</summary>
public sealed class SaveFacilityNodeRequest
{
    [Required(ErrorMessage = "Ad zorunludur.")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şehir zorunludur.")]
    [MaxLength(100)]
    public string City { get; set; } = string.Empty;

    public FacilityNodeType NodeType { get; set; } = FacilityNodeType.CollectionCenter;

    public FacilityNodeStatus Status { get; set; } = FacilityNodeStatus.Active;

    [Range(-90, 90, ErrorMessage = "Enlem -90 ile 90 arasında olmalıdır.")]
    public double Latitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Boylam -180 ile 180 arasında olmalıdır.")]
    public double Longitude { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public int SortOrder { get; set; }
}

/// <summary>Enum seçeneği (frontend dropdown'ı için).</summary>
public sealed class FacilityEnumOption<T>
{
    public T Value { get; init; } = default!;
    public string Label { get; init; } = string.Empty;
}

/// <summary>Harita meta verisi: tür + durum seçenekleri.</summary>
public sealed class FacilityMetaDto
{
    public IReadOnlyList<FacilityEnumOption<FacilityNodeType>> Types { get; init; } = Array.Empty<FacilityEnumOption<FacilityNodeType>>();
    public IReadOnlyList<FacilityEnumOption<FacilityNodeStatus>> Statuses { get; init; } = Array.Empty<FacilityEnumOption<FacilityNodeStatus>>();
}

/// <summary>FacilityNodeType değerlerinin Türkçe etiketleri.</summary>
public static class FacilityNodeTypeLabels
{
    public static string Of(FacilityNodeType type) => type switch
    {
        FacilityNodeType.Headquarters => "Genel Merkez",
        FacilityNodeType.CollectionCenter => "Toplama Merkezi",
        FacilityNodeType.Facility => "Tesis",
        FacilityNodeType.DistributionCenter => "Dağıtım Merkezi",
        _ => type.ToString(),
    };

    public static IReadOnlyList<FacilityEnumOption<FacilityNodeType>> All { get; } =
        Enum.GetValues<FacilityNodeType>()
            .Select(t => new FacilityEnumOption<FacilityNodeType> { Value = t, Label = Of(t) })
            .ToList();
}

/// <summary>FacilityNodeStatus değerlerinin Türkçe etiketleri.</summary>
public static class FacilityNodeStatusLabels
{
    public static string Of(FacilityNodeStatus status) => status switch
    {
        FacilityNodeStatus.Active => "Aktif",
        FacilityNodeStatus.Planned => "Planlı",
        FacilityNodeStatus.Inactive => "Pasif",
        _ => status.ToString(),
    };

    public static IReadOnlyList<FacilityEnumOption<FacilityNodeStatus>> All { get; } =
        Enum.GetValues<FacilityNodeStatus>()
            .Select(s => new FacilityEnumOption<FacilityNodeStatus> { Value = s, Label = Of(s) })
            .ToList();
}
