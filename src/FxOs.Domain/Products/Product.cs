using FxOs.Domain.Common;
using FxOs.Domain.Definitions;
using FxOs.Domain.PreAccounting;

namespace FxOs.Domain.Products;

/// <summary>
/// Ürün kartı. Bir müşteriye (cari) ait olabilir; grup/tür alanları serbest string yerine
/// <see cref="Definition"/> kayıtlarına FK ile bağlanır (type-safe lookup). Sabit ambalaj birimi
/// <see cref="Products.PackageType"/> enum'ıdır.
/// </summary>
public class Product : BaseEntity
{
    /// <summary>Sahip müşteri (cari, opsiyonel).</summary>
    public Guid? CustomerId { get; set; }
    public Account? Customer { get; set; }

    /// <summary>Ürün kodu (benzersiz olması beklenir).</summary>
    public string ProductCode { get; set; } = string.Empty;

    /// <summary>Barkod (opsiyonel, verildiyse benzersiz).</summary>
    public string? Barcode { get; set; }

    /// <summary>Ürün adı.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Net gramaj (gram).</summary>
    public decimal? NetWeight { get; set; }

    /// <summary>Brüt gramaj (gram).</summary>
    public decimal? GrossWeight { get; set; }

    /// <summary>Ambalaj/satış birimi.</summary>
    public PackageType PackageType { get; set; } = PackageType.Unit;

    /// <summary>Paket içi adet.</summary>
    public int? UnitsPerPackage { get; set; }

    /// <summary>Koli içi adet.</summary>
    public int? UnitsPerCase { get; set; }

    /// <summary>Ürün grubu (Definition · ProductGroup).</summary>
    public Guid? ProductGroupId { get; set; }
    public Definition? ProductGroup { get; set; }

    /// <summary>İade grubu (Definition · ReturnGroup).</summary>
    public Guid? ReturnGroupId { get; set; }
    public Definition? ReturnGroup { get; set; }

    /// <summary>Atık grubu (Definition · WasteGroup).</summary>
    public Guid? WasteGroupId { get; set; }
    public Definition? WasteGroup { get; set; }

    /// <summary>İşlem türü (Definition · ProcessType).</summary>
    public Guid? ProcessTypeId { get; set; }
    public Definition? ProcessType { get; set; }

    /// <summary>Pasif ürünler yeni kayıtlarda seçilemez (geçmiş veriler korunur).</summary>
    public bool IsActive { get; set; } = true;
}
