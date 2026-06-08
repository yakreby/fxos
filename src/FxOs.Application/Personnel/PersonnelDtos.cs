using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Personnel;

namespace FxOs.Application.Personnel;

/// <summary>Hafif personel kaydı (dropdown'lar için; id + ad soyad).</summary>
public sealed class PersonnelLookupDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
}

/// <summary>Personel listesi satırı (departman/kadro adları çözülmüş).</summary>
public sealed class PersonnelListItemDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? PositionId { get; init; }
    public string? PositionName { get; init; }
    public PersonnelStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public DateTime? HireDate { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Tek personel detayı (düzenleme formu + detay sayfası bilgi kartı).</summary>
public sealed class PersonnelDetailDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string? NationalId { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? PositionId { get; init; }
    public string? PositionName { get; init; }
    public DateTime? HireDate { get; init; }
    public PersonnelStatus Status { get; init; }
    public string StatusLabel { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public sealed class CreatePersonnelRequest
{
    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Soyad zorunludur."), MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(11)]
    [RegularExpression(@"^\d+$", ErrorMessage = "T.C. Kimlik No yalnızca rakamlardan oluşmalıdır.")]
    public string? NationalId { get; set; }

    [EmailAddress(ErrorMessage = "Geçerli bir e-posta giriniz."), MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(32)]
    public string? Phone { get; set; }

    public Guid? DepartmentId { get; set; }
    public Guid? PositionId { get; set; }
    public DateTime? HireDate { get; set; }
    public PersonnelStatus Status { get; set; } = PersonnelStatus.Active;

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

public sealed class UpdatePersonnelRequest
{
    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Soyad zorunludur."), MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [MaxLength(11)]
    [RegularExpression(@"^\d+$", ErrorMessage = "T.C. Kimlik No yalnızca rakamlardan oluşmalıdır.")]
    public string? NationalId { get; set; }

    [EmailAddress(ErrorMessage = "Geçerli bir e-posta giriniz."), MaxLength(256)]
    public string? Email { get; set; }

    [MaxLength(32)]
    public string? Phone { get; set; }

    public Guid? DepartmentId { get; set; }
    public Guid? PositionId { get; set; }
    public DateTime? HireDate { get; set; }
    public PersonnelStatus Status { get; set; } = PersonnelStatus.Active;

    [MaxLength(2000)]
    public string? Notes { get; set; }
}

/// <summary>Personel statü değerlerinin Türkçe etiketleri (UI ve liste için).</summary>
public static class PersonnelStatusLabels
{
    public static string Of(PersonnelStatus status) => status switch
    {
        PersonnelStatus.Active => "Aktif",
        PersonnelStatus.OnLeave => "İzinde",
        PersonnelStatus.Terminated => "Ayrıldı",
        _ => status.ToString(),
    };
}
