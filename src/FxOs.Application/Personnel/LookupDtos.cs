using System.ComponentModel.DataAnnotations;

namespace FxOs.Application.Personnel;

/// <summary>Departman/kadro gibi basit lookup kayıtları için ortak DTO.</summary>
public sealed class LookupDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }

    /// <summary>Bu lookup'a bağlı (silinmemiş) personel sayısı.</summary>
    public int PersonnelCount { get; init; }
}

/// <summary>Departman/kadro oluşturma-güncelleme isteği.</summary>
public sealed class LookupRequest
{
    [Required(ErrorMessage = "Ad zorunludur."), MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }
}
