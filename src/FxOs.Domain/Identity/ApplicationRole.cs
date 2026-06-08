using Microsoft.AspNetCore.Identity;

namespace FxOs.Domain.Identity;

/// <summary>
/// FxOs rolü. <see cref="IdentityRole{TKey}"/> temelini Guid anahtarla genişletir.
/// İzin (permission) matrisi Faz 3'te ayrı bir model üzerinden bu role bağlanacak.
/// </summary>
public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() { }

    public ApplicationRole(string roleName) : base(roleName) { }

    /// <summary>Rolün insan-okur açıklaması (yönetim ekranı için).</summary>
    public string? Description { get; set; }
}
