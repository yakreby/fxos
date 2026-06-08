using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// Sevkiyat & Lojistik (PLACEHOLDER — henüz uygulanmadı).
/// Planlanan entity'ler: Shipment, ShipmentRequest, Route(+RouteStop), LogisticsMovement,
/// Waybill, Location (nokta), Vehicle (sürücü = Personnel FK).
/// Planlanan uçlar: sevkiyat planla/oluştur, talep+onay, rota planla/liste, lojistik
/// hareketleri, irsaliye oluştur/durum/PDF, lokasyon CRUD, araç CRUD. Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/shipment")]
[Authorize]
public sealed class ShipmentController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("Sevkiyat & Lojistik modülü henüz uygulanmadı (iskelet)."));
}
