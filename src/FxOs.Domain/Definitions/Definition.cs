using FxOs.Domain.Common;

namespace FxOs.Domain.Definitions;

/// <summary>
/// Sistem geneli tek tablolu lookup kaydı. <see cref="Type"/> ayracıyla farklı tanım
/// kümelerini (atık lokasyonu/tipi, iade/atık/işlem/ürün grubu) barındırır. Diğer modüller
/// serbest string yerine bu kayıtlara <c>Guid</c> FK ile bağlanır (join/include stabilitesi).
/// </summary>
public class Definition : BaseEntity
{
    /// <summary>Bu tanımın ait olduğu lookup kümesi.</summary>
    public DefinitionType Type { get; set; }

    /// <summary>Opsiyonel kısa kod (ör. atık kodu PALET-150103). Tür içinde benzersiz olması beklenir.</summary>
    public string? Code { get; set; }

    /// <summary>Görünen ad. Tür içinde benzersiz olması beklenir.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Pasif tanımlar yeni kayıtlarda seçilemez (geçmiş veriler korunur).</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Listeleme sırası (küçük önce); eşitlikte ada göre sıralanır.</summary>
    public int SortOrder { get; set; }
}
