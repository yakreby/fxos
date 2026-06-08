namespace FxOs.Domain.GoodsReceipts;

/// <summary>Mal kabul fişinin durumu. Sabit küme olduğu için enum.</summary>
public enum GoodsReceiptStatus
{
    /// <summary>Taslak — düzenlenebilir, henüz kesinleşmedi.</summary>
    Draft = 0,

    /// <summary>Onaylandı — kabul kesinleşti (ileride stok girişi tetikler).</summary>
    Confirmed = 1,

    /// <summary>İptal edildi.</summary>
    Cancelled = 2,
}
