using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Definitions;

namespace FxOs.Application.Definitions;

/// <summary>Tek tanım kaydı (liste + form).</summary>
public sealed class DefinitionDto
{
    public Guid Id { get; init; }
    public DefinitionType Type { get; init; }
    public string TypeLabel { get; init; } = string.Empty;
    public string? Code { get; init; }
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public int SortOrder { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Tanım oluşturma isteği (Type yalnız oluştururken belirlenir).</summary>
public sealed class CreateDefinitionRequest
{
    [Required(ErrorMessage = "Tür zorunludur.")]
    public DefinitionType Type { get; set; }

    [MaxLength(50)]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}

/// <summary>Tanım güncelleme isteği (tür değiştirilemez).</summary>
public sealed class UpdateDefinitionRequest
{
    [MaxLength(50)]
    public string? Code { get; set; }

    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public int SortOrder { get; set; }
}

/// <summary>Tanım türü seçeneği (frontend sekmeleri için: değer + etiket).</summary>
public sealed class DefinitionTypeOption
{
    public DefinitionType Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>DefinitionType değerlerinin Türkçe etiketleri.</summary>
public static class DefinitionTypeLabels
{
    public static string Of(DefinitionType type) => type switch
    {
        DefinitionType.WasteLocation => "Atık Lokasyonu",
        DefinitionType.WasteType => "Atık Tipi",
        DefinitionType.ReturnGroup => "İade Grubu",
        DefinitionType.WasteGroup => "Atık Grubu",
        DefinitionType.ProcessType => "İşlem Türü",
        DefinitionType.ProductGroup => "Ürün Grubu",
        _ => type.ToString(),
    };

    /// <summary>Tüm türler (sekme/seçenek listesi için), enum sırasında.</summary>
    public static IReadOnlyList<DefinitionTypeOption> All { get; } =
        Enum.GetValues<DefinitionType>()
            .Select(t => new DefinitionTypeOption { Value = t, Label = Of(t) })
            .ToList();
}
