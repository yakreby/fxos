using Microsoft.AspNetCore.Authorization;

namespace FxOs.API.Authorization;

/// <summary>
/// Controller/action'a izin (permission) zorunluluğu ekler:
/// <c>[HasPermission(Permissions.Users.Create)]</c>. Policy adı "perm:{izin}" olarak
/// kodlanır ve <see cref="PermissionPolicyProvider"/> tarafından dinamik karşılanır.
/// </summary>
public sealed class HasPermissionAttribute : AuthorizeAttribute
{
    public const string PolicyPrefix = "perm:";

    public HasPermissionAttribute(string permission)
    {
        Policy = $"{PolicyPrefix}{permission}";
    }
}
