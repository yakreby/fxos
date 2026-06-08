using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// Tesis Yönetimi (PLACEHOLDER — henüz uygulanmadı). Tesis içi stok ve hareket operasyonu.
/// Planlanan entity'ler: GoodsReceipt(+Line), OutboundEntry, StockItem, Shelf/Rack,
/// StockMovement, Octabin, SeparationRequest, Appointment.
/// Planlanan uçlar (özet): mal kabul oluştur/iptal, çıkış, stok listesi, raf doluluk,
/// hareket günlüğü, octabin aç/kapat, separasyon talebi, randevu. Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/facility")]
[Authorize]
public sealed class FacilityController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("Tesis Yönetimi modülü henüz uygulanmadı (iskelet)."));
}
