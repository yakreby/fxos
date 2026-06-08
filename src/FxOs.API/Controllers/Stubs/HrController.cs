using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// İnsan Kaynakları — izin/çalışma (PLACEHOLDER). (Personel modülü ayrı: PersonnelController ✅.)
/// Planlanan entity'ler: LeaveRequest (Personnel FK + onay), WorkLog (mesai).
/// Planlanan uçlar: izin talep/onay/bakiye, çalışma raporu/dönem. Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/hr")]
[Authorize]
public sealed class HrController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("İK (izin/çalışma) modülü henüz uygulanmadı (iskelet)."));
}
