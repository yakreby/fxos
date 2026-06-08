using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers;

/// <summary>İzin kataloğu (rol-izin matrisi UI'ı için modül-bazlı gruplu liste).</summary>
[ApiController]
[Route("api/permissions")]
[Authorize]
public sealed class PermissionsController : ControllerBase
{
    [HttpGet]
    [HasPermission(Permissions.Roles.View)]
    public IActionResult Catalog()
        => Ok(Result<IReadOnlyList<PermissionGroup>>.Success(Permissions.Catalog));
}
