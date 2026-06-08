namespace FxOs.Domain.Separations;

/// <summary>Separasyon (ayrıştırma) talebinin durumu. Sabit küme olduğu için enum.</summary>
public enum SeparationStatus
{
    /// <summary>Beklemede — talep oluşturuldu, henüz başlanmadı.</summary>
    Pending = 0,

    /// <summary>Ayrıştırılıyor — işlem sürüyor.</summary>
    InProgress = 1,

    /// <summary>Tamamlandı — ayrıştırma bitti (kilitli).</summary>
    Completed = 2,

    /// <summary>İptal edildi.</summary>
    Cancelled = 3,
}
