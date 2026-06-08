using FxOs.Domain.Common;
using FxOs.Domain.Products;

namespace FxOs.Domain.Stock;

/// <summary>
/// Stok hareketi (ledger). Tek kayıt = tek rafta tek ürünün işaretli (giriş/çıkış) değişimi.
/// Eldeki stok bu hareketlerden hesaplanır. Transfer iki hareketle modellenir (kaynak Çıkış + hedef Giriş).
/// </summary>
public class StockMovement : BaseEntity
{
    /// <summary>Hareket gören ürün.</summary>
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    /// <summary>Raf/lokasyon (opsiyonel).</summary>
    public Guid? ShelfId { get; set; }
    public Shelf? Shelf { get; set; }

    /// <summary>Yön (giriş/çıkış).</summary>
    public StockDirection Direction { get; set; }

    /// <summary>Hareket türü (kaynak).</summary>
    public StockMovementType Type { get; set; }

    /// <summary>Miktar (her zaman pozitif; yön işareti belirler).</summary>
    public decimal Quantity { get; set; }

    /// <summary>Ağırlık (KG, opsiyonel).</summary>
    public decimal? Weight { get; set; }

    /// <summary>Hareket tarihi.</summary>
    public DateTime MovementDate { get; set; }

    /// <summary>Referans (ör. mal kabul fiş no, belge no) — opsiyonel.</summary>
    public string? Reference { get; set; }

    /// <summary>Bu hareketi üreten mal kabul fişi (varsa). Onay geri alınınca bu hareketler silinir.</summary>
    public Guid? GoodsReceiptId { get; set; }

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Note { get; set; }
}
