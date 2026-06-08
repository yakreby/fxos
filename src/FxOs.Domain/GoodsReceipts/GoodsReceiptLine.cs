using FxOs.Domain.Common;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;

namespace FxOs.Domain.GoodsReceipts;

/// <summary>
/// Mal kabul fişi satırı — kabul edilen tek bir ürün kalemi (miktar + tartım + raf adreslemesi).
/// </summary>
public class GoodsReceiptLine : BaseEntity
{
    /// <summary>Bağlı olduğu fiş.</summary>
    public Guid GoodsReceiptId { get; set; }
    public GoodsReceipt? GoodsReceipt { get; set; }

    /// <summary>Kabul edilen ürün.</summary>
    public Guid ProductId { get; set; }
    public Product? Product { get; set; }

    /// <summary>Yerleştirileceği raf (adresleme; opsiyonel). Onayda stok girişi bu rafa yapılır.</summary>
    public Guid? ShelfId { get; set; }
    public Shelf? Shelf { get; set; }

    /// <summary>Miktar (adet/paket — fiş ürününün birimine göre).</summary>
    public decimal Quantity { get; set; }

    /// <summary>Tartım (KG, opsiyonel).</summary>
    public decimal? Weight { get; set; }

    /// <summary>Satır notu (opsiyonel).</summary>
    public string? Note { get; set; }
}
