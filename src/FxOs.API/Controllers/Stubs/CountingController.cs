using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// Sayım & Saha (PLACEHOLDER — henüz uygulanmadı).
/// Planlanan entity'ler: Count(+CountLine), FieldPhoto (IFileStorage), Panorama.
/// Planlanan uçlar: sayım liste/oluştur/güncelle, saha fotoğrafları, panorama,
/// nokta & zincir raporları (sayım verisinden türetilir). Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/counting")]
[Authorize]
public sealed class CountingController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("Sayım & Saha modülü henüz uygulanmadı (iskelet)."));
}
