namespace FxOs.Domain.Identity;

/// <summary>
/// Sistemin temel rol adları. Yetkilendirme (policy/[Authorize(Roles=...)]) ve
/// seed işlemlerinde tek kaynak olarak kullanılır. İzin matrisi Faz 3'te genişleyecek.
/// </summary>
public static class FxRoles
{
    /// <summary>Tam yetkili yönetici.</summary>
    public const string Admin = "Admin";

    /// <summary>Standart kullanıcı.</summary>
    public const string User = "User";

    /// <summary>Seed sırasında oluşturulacak tüm temel roller.</summary>
    public static readonly IReadOnlyList<string> All = new[] { Admin, User };
}
