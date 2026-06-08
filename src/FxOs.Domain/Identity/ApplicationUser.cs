using Microsoft.AspNetCore.Identity;

namespace FxOs.Domain.Identity;

/// <summary>
/// FxOs kullanıcısı. ASP.NET Core Identity'nin <see cref="IdentityUser{TKey}"/>
/// temelini Guid anahtarla genişletir (kural: tüm PK'ler Guid).
/// Identity tabloları kendi audit'ini taşır; bu yüzden <c>BaseEntity</c>'den türemez,
/// ihtiyaç duyulan alanlar burada açıkça tanımlanır.
/// </summary>
public class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>Görünen ad-soyad.</summary>
    public string? FullName { get; set; }

    /// <summary>Hesap aktif mi? Pasif kullanıcı giriş yapamaz.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Kaydın oluşturulduğu an (UTC).</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Son güncelleme anı (UTC, varsa).</summary>
    public DateTime? UpdatedAt { get; set; }
}
