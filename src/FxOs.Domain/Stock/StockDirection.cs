namespace FxOs.Domain.Stock;

/// <summary>Stok hareketinin yönü. Eldeki miktar = Σ(Giriş) − Σ(Çıkış).</summary>
public enum StockDirection
{
    /// <summary>Giriş (stok artar).</summary>
    In = 0,

    /// <summary>Çıkış (stok azalır).</summary>
    Out = 1,
}
