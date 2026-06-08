using System.Security.Claims;
using FxOs.API.Authorization;
using FxOs.Application.Access;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Domain.Identity;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers;

/// <summary>Rol ve izin (permission) yönetimi (Identity &amp; Access).</summary>
[ApiController]
[Route("api/roles")]
[Authorize]
public sealed class RolesController : ControllerBase
{
    private readonly RoleManager<ApplicationRole> _roleManager;

    public RolesController(RoleManager<ApplicationRole> roleManager)
    {
        _roleManager = roleManager;
    }

    [HttpGet]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> List()
    {
        var roles = _roleManager.Roles.OrderBy(r => r.Name).ToList();

        var items = new List<RoleListItemDto>(roles.Count);
        foreach (var role in roles)
        {
            var permissions = await GetPermissionsAsync(role);
            items.Add(new RoleListItemDto
            {
                Id = role.Id,
                Name = role.Name ?? string.Empty,
                Description = role.Description,
                PermissionCount = permissions.Count,
                IsSystem = IsSystemRole(role.Name),
            });
        }

        return Ok(Result<IReadOnlyList<RoleListItemDto>>.Success(items));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Roles.View)]
    public async Task<IActionResult> Get(Guid id)
    {
        var role = await _roleManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Rol", id);

        return Ok(Result<RoleDetailDto>.Success(new RoleDetailDto
        {
            Id = role.Id,
            Name = role.Name ?? string.Empty,
            Description = role.Description,
            IsSystem = IsSystemRole(role.Name),
            Permissions = await GetPermissionsAsync(role),
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.Roles.Create)]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        ValidatePermissions(request.Permissions);

        if (await _roleManager.RoleExistsAsync(request.Name))
            throw new ConflictException($"'{request.Name}' adında bir rol zaten var.");

        var role = new ApplicationRole(request.Name) { Description = request.Description };
        var created = await _roleManager.CreateAsync(role);
        if (!created.Succeeded)
            throw new ValidationException(created.Errors.Select(e => e.Description));

        foreach (var permission in request.Permissions.Distinct())
            await _roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));

        return Ok(Result<Guid>.Success(role.Id, "Rol oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Roles.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateRoleRequest request)
    {
        ValidatePermissions(request.Permissions);

        var role = await _roleManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Rol", id);

        role.Description = request.Description;
        var updated = await _roleManager.UpdateAsync(role);
        if (!updated.Succeeded)
            throw new ValidationException(updated.Errors.Select(e => e.Description));

        // İzinleri istenen kümeyle senkronla.
        var current = await GetPermissionsAsync(role);
        var target = request.Permissions.Distinct().ToArray();
        foreach (var permission in current.Except(target))
            await _roleManager.RemoveClaimAsync(role, new Claim(Permissions.ClaimType, permission));
        foreach (var permission in target.Except(current))
            await _roleManager.AddClaimAsync(role, new Claim(Permissions.ClaimType, permission));

        return Ok(Result.Success("Rol güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Roles.Delete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var role = await _roleManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Rol", id);

        if (IsSystemRole(role.Name))
            throw new BusinessRuleException("Çekirdek roller (Admin/User) silinemez.");

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            throw new ValidationException(result.Errors.Select(e => e.Description));

        return Ok(Result.Success("Rol silindi."));
    }

    private async Task<IReadOnlyList<string>> GetPermissionsAsync(ApplicationRole role)
    {
        var claims = await _roleManager.GetClaimsAsync(role);
        return claims.Where(c => c.Type == Permissions.ClaimType).Select(c => c.Value).ToArray();
    }

    private static void ValidatePermissions(IEnumerable<string> permissions)
    {
        var invalid = permissions.Distinct().Where(p => !Permissions.IsValid(p)).ToArray();
        if (invalid.Length > 0)
            throw new ValidationException($"Geçersiz izin(ler): {string.Join(", ", invalid)}");
    }

    private static bool IsSystemRole(string? name) =>
        name is not null && FxRoles.All.Contains(name);
}
