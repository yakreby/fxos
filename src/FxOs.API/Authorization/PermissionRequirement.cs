using FxOs.Application.Common.Authorization;
using Microsoft.AspNetCore.Authorization;

namespace FxOs.API.Authorization;

/// <summary>Belirli bir iznin varlığını şart koşan yetkilendirme gereksinimi.</summary>
public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission) => Permission = permission;
}

/// <summary>
/// <see cref="PermissionRequirement"/>'ı karşılar: kullanıcının principal'ında
/// ilgili "permission" claim'i var mı diye bakar (claim'ler giriş anında rollerden gelir).
/// </summary>
public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        if (context.User.HasClaim(Permissions.ClaimType, requirement.Permission))
            context.Succeed(requirement);

        return Task.CompletedTask;
    }
}
