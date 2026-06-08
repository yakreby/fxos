using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Logging;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers;

/// <summary>Sistem logları (Serilog "Logs" tablosu, Warning+). Salt-okunur; <c>logs.view</c> izni.</summary>
[ApiController]
[Route("api/logs")]
[Authorize]
public sealed class LogsController : ControllerBase
{
    private readonly ILogReader _logReader;

    public LogsController(ILogReader logReader) => _logReader = logReader;

    [HttpGet]
    [HasPermission(Permissions.Logs.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest paging,
        [FromQuery] string? level,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        CancellationToken ct)
    {
        var request = new LogQueryRequest
        {
            Page = paging.Page,
            PageSize = paging.PageSize,
            Search = paging.Search,
            Level = string.IsNullOrWhiteSpace(level) ? null : level.Trim(),
            From = from,
            To = to,
        };

        var result = await _logReader.QueryAsync(request, ct);
        return Ok(Result<PagedResult<LogEntryDto>>.Success(result));
    }

    /// <summary>UI filtresi için seviye listesi (Warning/Error/Fatal).</summary>
    [HttpGet("levels")]
    [HasPermission(Permissions.Logs.View)]
    public IActionResult Levels()
        => Ok(Result<IReadOnlyList<string>>.Success(LogLevels.All));
}
