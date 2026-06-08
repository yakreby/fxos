using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Products;

namespace FxOs.Application.Products;

/// <summary>Ürün için hafif lookup kaydı (dropdown'lar — ör. mal kabul satırı).</summary>
public sealed class ProductLookupDto
{
    public Guid Id { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

/// <summary>Ürün listesi satırı (çözülmüş müşteri/grup adlarıyla).</summary>
public sealed class ProductListItemDto
{
    public Guid Id { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string? Barcode { get; init; }
    public string Name { get; init; } = string.Empty;
    public Guid? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public PackageType PackageType { get; init; }
    public string PackageTypeLabel { get; init; } = string.Empty;
    public decimal? NetWeight { get; init; }
    public string? ProductGroupName { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Tek ürün detayı (form + detay sayfası).</summary>
public sealed class ProductDetailDto
{
    public Guid Id { get; init; }
    public string ProductCode { get; init; } = string.Empty;
    public string? Barcode { get; init; }
    public string Name { get; init; } = string.Empty;
    public Guid? CustomerId { get; init; }
    public string? CustomerName { get; init; }
    public decimal? NetWeight { get; init; }
    public decimal? GrossWeight { get; init; }
    public PackageType PackageType { get; init; }
    public string PackageTypeLabel { get; init; } = string.Empty;
    public int? UnitsPerPackage { get; init; }
    public int? UnitsPerCase { get; init; }
    public Guid? ProductGroupId { get; init; }
    public string? ProductGroupName { get; init; }
    public Guid? ReturnGroupId { get; init; }
    public string? ReturnGroupName { get; init; }
    public Guid? WasteGroupId { get; init; }
    public string? WasteGroupName { get; init; }
    public Guid? ProcessTypeId { get; init; }
    public string? ProcessTypeName { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

/// <summary>Ürün oluşturma/güncelleme isteği (ortak alanlar).</summary>
public sealed class SaveProductRequest
{
    public Guid? CustomerId { get; set; }

    [Required(ErrorMessage = "Ürün kodu zorunludur."), MaxLength(50)]
    public string ProductCode { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Barcode { get; set; }

    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Range(0, 9_999_999, ErrorMessage = "Net gramaj negatif olamaz.")]
    public decimal? NetWeight { get; set; }

    [Range(0, 9_999_999, ErrorMessage = "Brüt gramaj negatif olamaz.")]
    public decimal? GrossWeight { get; set; }

    public PackageType PackageType { get; set; } = PackageType.Unit;

    [Range(0, int.MaxValue, ErrorMessage = "Paket içi adet negatif olamaz.")]
    public int? UnitsPerPackage { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Koli içi adet negatif olamaz.")]
    public int? UnitsPerCase { get; set; }

    public Guid? ProductGroupId { get; set; }
    public Guid? ReturnGroupId { get; set; }
    public Guid? WasteGroupId { get; set; }
    public Guid? ProcessTypeId { get; set; }

    public bool IsActive { get; set; } = true;
}

/// <summary>PackageType seçeneği (frontend dropdown'ı için).</summary>
public sealed class PackageTypeOption
{
    public PackageType Value { get; init; }
    public string Label { get; init; } = string.Empty;
}

/// <summary>PackageType değerlerinin Türkçe etiketleri.</summary>
public static class PackageTypeLabels
{
    public static string Of(PackageType type) => type switch
    {
        PackageType.Unit => "Adet",
        PackageType.Package => "Paket",
        PackageType.Case => "Koli",
        _ => type.ToString(),
    };

    public static IReadOnlyList<PackageTypeOption> All { get; } =
        Enum.GetValues<PackageType>()
            .Select(t => new PackageTypeOption { Value = t, Label = Of(t) })
            .ToList();
}
