using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers.Stubs;

/// <summary>
/// Masraf Yönetimi (PLACEHOLDER). (Cari hesaplar ayrı: AccountsController ✅.)
/// Planlanan entity'ler: Expense (masraf + kategori + onay), PersonnelExpense
/// (personel bazlı masraf/avans/mahsup, Personnel FK).
/// Planlanan uçlar: masraf CRUD/onay/rapor, personel masrafı CRUD. Detay: docs/MODULES.md.
/// </summary>
[ApiController]
[Route("api/expenses")]
[Authorize]
public sealed class ExpensesController : ControllerBase
{
    /// <summary>Modül iskelet aşamasında; 501 döner.</summary>
    [HttpGet("status")]
    public IActionResult Status() =>
        StatusCode(501, Result.Failure("Masraf Yönetimi modülü henüz uygulanmadı (iskelet)."));
}
