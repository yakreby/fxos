using FxOs.API.Authorization;
using FxOs.Application.Access;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Domain.Identity;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>Kullanıcı yönetimi (Identity &amp; Access). İzin tabanlı korunur.</summary>
[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;

    public UsersController(
        UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    [HasPermission(Permissions.Users.View)]
    public async Task<IActionResult> List([FromQuery] PaginationRequest request, CancellationToken ct)
    {
        var query = _userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(u =>
                (u.Email != null && u.Email.Contains(s)) ||
                (u.FullName != null && u.FullName.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "fullname" => request.SortDescending ? query.OrderByDescending(u => u.FullName) : query.OrderBy(u => u.FullName),
            "createdat" => request.SortDescending ? query.OrderByDescending(u => u.CreatedAt) : query.OrderBy(u => u.CreatedAt),
            "isactive" => request.SortDescending ? query.OrderByDescending(u => u.IsActive) : query.OrderBy(u => u.IsActive),
            _ => request.SortDescending ? query.OrderByDescending(u => u.Email) : query.OrderBy(u => u.Email),
        };

        var total = await query.CountAsync(ct);
        var users = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = new List<UserListItemDto>(users.Count);
        foreach (var u in users)
        {
            var roles = await _userManager.GetRolesAsync(u);
            items.Add(new UserListItemDto
            {
                Id = u.Id,
                Email = u.Email ?? string.Empty,
                FullName = u.FullName,
                IsActive = u.IsActive,
                Roles = roles.ToArray(),
                CreatedAt = u.CreatedAt,
            });
        }

        var paged = new PagedResult<UserListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<UserListItemDto>>.Success(paged));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Users.View)]
    public async Task<IActionResult> Get(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Kullanıcı", id);
        return Ok(Result<UserDetailDto>.Success(await ToDetailAsync(user)));
    }

    [HttpPost]
    [HasPermission(Permissions.Users.Create)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        await EnsureRolesExistAsync(request.Roles);

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            FullName = request.FullName,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
        };

        var created = await _userManager.CreateAsync(user, request.Password);
        if (!created.Succeeded)
            throw new ValidationException(created.Errors.Select(e => e.Description));

        if (request.Roles.Count > 0)
            await _userManager.AddToRolesAsync(user, request.Roles.Distinct());

        return Ok(Result<UserDetailDto>.Success(await ToDetailAsync(user), "Kullanıcı oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Users.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Kullanıcı", id);
        await EnsureRolesExistAsync(request.Roles);

        user.FullName = request.FullName;
        user.IsActive = request.IsActive;
        user.UpdatedAt = DateTime.UtcNow;

        var updated = await _userManager.UpdateAsync(user);
        if (!updated.Succeeded)
            throw new ValidationException(updated.Errors.Select(e => e.Description));

        // Rolleri istenen kümeyle senkronla.
        var current = await _userManager.GetRolesAsync(user);
        var target = request.Roles.Distinct().ToArray();
        var toRemove = current.Except(target).ToArray();
        var toAdd = target.Except(current).ToArray();
        if (toRemove.Length > 0) await _userManager.RemoveFromRolesAsync(user, toRemove);
        if (toAdd.Length > 0) await _userManager.AddToRolesAsync(user, toAdd);

        return Ok(Result.Success("Kullanıcı güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Users.Delete)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString())
            ?? throw new NotFoundException("Kullanıcı", id);

        if (_userManager.GetUserId(User) == user.Id.ToString())
            throw new BusinessRuleException("Kendi hesabınızı silemezsiniz.");

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            throw new ValidationException(result.Errors.Select(e => e.Description));

        return Ok(Result.Success("Kullanıcı silindi."));
    }

    private async Task<UserDetailDto> ToDetailAsync(ApplicationUser user) => new()
    {
        Id = user.Id,
        Email = user.Email ?? string.Empty,
        FullName = user.FullName,
        IsActive = user.IsActive,
        Roles = (await _userManager.GetRolesAsync(user)).ToArray(),
    };

    private async Task EnsureRolesExistAsync(IEnumerable<string> roles)
    {
        foreach (var role in roles.Distinct())
            if (!await _roleManager.RoleExistsAsync(role))
                throw new ValidationException($"Rol bulunamadı: {role}");
    }
}
