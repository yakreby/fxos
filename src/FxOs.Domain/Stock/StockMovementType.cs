namespace FxOs.Domain.Stock;

/// <summary>Stok hareketinin türü (kaynağı). Yön (<see cref="StockDirection"/>) ayrı tutulur.</summary>
public enum StockMovementType
{
    /// <summary>Mal kabul / giriş.</summary>
    Receipt = 0,

    /// <summary>Çıkış / sevk.</summary>
    Issue = 1,

    /// <summary>Raf/lokasyon transferi.</summary>
    Transfer = 2,

    /// <summary>Manuel düzeltme.</summary>
    Adjustment = 3,

    /// <summary>Sayım sonucu.</summary>
    Count = 4,
}
