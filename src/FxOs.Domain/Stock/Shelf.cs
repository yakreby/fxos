using FxOs.Domain.Common;

namespace FxOs.Domain.Stock;

/// <summary>
/// Raf / depo lokasyonu (ör. KT1-A-01). Stok hareketleri opsiyonel olarak bir rafa bağlanır;
/// rafın doluluğu hareketlerden hesaplanır (entity'de tutulmaz).
/// </summary>
public class Shelf : BaseEntity
{
    /// <summary>Raf kodu (benzersiz).</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Raf adı/açıklaması.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Kapasite (adet/KG — bilgi amaçlı, opsiyonel).</summary>
    public decimal? Capacity { get; set; }

    /// <summary>Pasif raflar yeni hareketlerde seçilemez.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }
}
