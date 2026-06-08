using FxOs.Domain.Common;
using FxOs.Domain.PreAccounting;

namespace FxOs.Domain.GoodsReceipts;

/// <summary>
/// Mal kabul fişi (başlık). Gelen ürünlerin tesise kabulü; satırlarda ürün + miktar + tartım (KG).
/// Tedarikçi cari (Account) FK'sidir. İleride onaylanınca stok girişi + raf/octabin adresleme bağlanacak.
/// </summary>
public class GoodsReceipt : BaseEntity
{
    /// <summary>Fiş numarası (benzersiz; boş verilirse otomatik üretilir).</summary>
    public string ReceiptNumber { get; set; } = string.Empty;

    /// <summary>Kabul tarihi.</summary>
    public DateTime ReceiptDate { get; set; }

    /// <summary>Tedarikçi (cari, opsiyonel).</summary>
    public Guid? SupplierId { get; set; }
    public Account? Supplier { get; set; }

    /// <summary>Fiş durumu.</summary>
    public GoodsReceiptStatus Status { get; set; } = GoodsReceiptStatus.Draft;

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }

    /// <summary>Fiş satırları.</summary>
    public ICollection<GoodsReceiptLine> Lines { get; set; } = new List<GoodsReceiptLine>();
}
