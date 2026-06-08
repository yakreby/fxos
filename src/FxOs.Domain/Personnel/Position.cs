using FxOs.Domain.Common;

namespace FxOs.Domain.Personnel;

/// <summary>
/// Kadro / pozisyon (ör. Şoför, Saha Sorumlusu, Muhasebe Uzmanı) — personelin görev unvanı.
/// Departmandan bağımsız global bir lookup'tır; personel kartında seçilir (opsiyonel).
/// </summary>
public class Position : BaseEntity
{
    /// <summary>Kadro/pozisyon adı.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Kısa açıklama (opsiyonel).</summary>
    public string? Description { get; set; }

    /// <summary>Bu kadroya sahip personel (ters navigasyon).</summary>
    public ICollection<Personnel> Personnel { get; set; } = new List<Personnel>();
}
