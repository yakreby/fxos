namespace FxOs.Domain.Products;

/// <summary>
/// Ürünün ambalaj/satış birimi. Sabit küme olduğu için (Definition değil) enum.
/// </summary>
public enum PackageType
{
    /// <summary>Adet (tekil).</summary>
    Unit = 0,

    /// <summary>Paket.</summary>
    Package = 1,

    /// <summary>Koli.</summary>
    Case = 2,
}
