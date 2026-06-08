using FxOs.Domain.Common;

namespace FxOs.Domain.Personnel;

/// <summary>
/// Personel kartı — projenin ilk gerçek iş entity'si (<see cref="BaseEntity"/> türevli).
/// Departman ve kadro (pozisyon) lookup'larına opsiyonel olarak bağlanır.
/// </summary>
public class Personnel : BaseEntity
{
    /// <summary>Ad.</summary>
    public string FirstName { get; set; } = string.Empty;

    /// <summary>Soyad.</summary>
    public string LastName { get; set; } = string.Empty;

    /// <summary>T.C. Kimlik No (opsiyonel).</summary>
    public string? NationalId { get; set; }

    /// <summary>E-posta (opsiyonel).</summary>
    public string? Email { get; set; }

    /// <summary>Telefon (opsiyonel).</summary>
    public string? Phone { get; set; }

    /// <summary>Bağlı olduğu departman (opsiyonel).</summary>
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }

    /// <summary>Kadro/pozisyon (opsiyonel).</summary>
    public Guid? PositionId { get; set; }
    public Position? Position { get; set; }

    /// <summary>İşe giriş tarihi (opsiyonel).</summary>
    public DateTime? HireDate { get; set; }

    /// <summary>İstihdam durumu.</summary>
    public PersonnelStatus Status { get; set; } = PersonnelStatus.Active;

    /// <summary>Serbest not (opsiyonel).</summary>
    public string? Notes { get; set; }

    /// <summary>Ad + soyad (hesaplanan; veritabanına yazılmaz).</summary>
    public string FullName => $"{FirstName} {LastName}".Trim();
}
