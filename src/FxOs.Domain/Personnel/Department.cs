using FxOs.Domain.Common;

namespace FxOs.Domain.Personnel;

/// <summary>
/// Organizasyon departmanı (ör. Saha Operasyon, Lojistik, İdari İşler).
/// Personel kayıtları bir departmana bağlanır (opsiyonel). İlk lookup entity'lerinden.
/// </summary>
public class Department : BaseEntity
{
    /// <summary>Departman adı (benzersiz olması beklenir).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Kısa açıklama (opsiyonel).</summary>
    public string? Description { get; set; }

    /// <summary>Bu departmana bağlı personel (ters navigasyon).</summary>
    public ICollection<Personnel> Personnel { get; set; } = new List<Personnel>();
}
