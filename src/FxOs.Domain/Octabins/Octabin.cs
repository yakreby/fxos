using FxOs.Domain.Common;
using FxOs.Domain.Definitions;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;

namespace FxOs.Domain.Octabins;

/// <summary>
/// Octabin (büyük konteyner). Açılır, içine malzeme doldurulur, dolunca kapatılır ve sevk edilir.
/// İçerik esnek modellenir: atık tipi (Definition FK) ve/veya ürün (Product FK) ve/veya serbest metin.
/// Doluluk = <see cref="NetWeight"/> / <see cref="Capacity"/> (DTO'da hesaplanır). Tek tablo, satırsız.
/// </summary>
public class Octabin : BaseEntity
{
    /// <summary>Octabin numarası (benzersiz; boş verilirse otomatik üretilir).</summary>
    public string OctabinNumber { get; set; } = string.Empty;

    /// <summary>Yaşam döngüsü durumu.</summary>
    public OctabinStatus Status { get; set; } = OctabinStatus.Open;

    /// <summary>İçerik — atık tipi (Definition, tür=WasteType; opsiyonel).</summary>
    public Guid? WasteTypeId { get; set; }
    public Definition? WasteType { get; set; }

    /// <summary>İçerik — ürün (opsiyonel).</summary>
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }

    /// <summary>İçerik — serbest açıklama (opsiyonel).</summary>
    public string? Content { get; set; }

    /// <summary>Bulunduğu raf/lokasyon (opsiyonel).</summary>
    public Guid? ShelfId { get; set; }
    public Shelf? Shelf { get; set; }

    /// <summary>Kapasite (KG — doluluk yüzdesi için; opsiyonel).</summary>
    public decimal? Capacity { get; set; }

    /// <summary>İçindeki net ağırlık (KG — doluluk; opsiyonel).</summary>
    public decimal? NetWeight { get; set; }

    /// <summary>Açılış tarihi.</summary>
    public DateTime OpenedDate { get; set; }

    /// <summary>Kapatılış (dolu) tarihi.</summary>
    public DateTime? ClosedDate { get; set; }

    /// <summary>Sevk tarihi.</summary>
    public DateTime? DispatchedDate { get; set; }

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }
}
