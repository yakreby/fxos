using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// Rapor Merkezi (PLACEHOLDER — henüz uygulanmadı).
/// Modüller arası raporlama: şablonlar, Excel/PDF dışa aktarma, zamanlanmış rapor.
/// Çoğunlukla diğer modüllerin verisinden türetilir (ayrı entity gerekmeyebilir).
/// Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/reports")]
[Authorize]
public sealed class ReportsController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("Rapor Merkezi modülü henüz uygulanmadı (iskelet)."));
}
