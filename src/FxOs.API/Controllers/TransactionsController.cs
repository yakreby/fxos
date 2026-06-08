using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.PreAccounting;
using FxOs.Domain.PreAccounting;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>Ön muhasebe — cari hareketleri (tahsilat/ödeme). <c>preaccounting.*</c> izinleri.</summary>
[ApiController]
[Authorize]
public sealed class TransactionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public TransactionsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet("api/preaccounting/accounts/{accountId:guid}/transactions")]
    [HasPermission(Permissions.PreAccounting.View)]
    public async Task<IActionResult> List(Guid accountId, [FromQuery] PaginationRequest request, CancellationToken ct)
    {
        var query = _uow.Repository<Transaction>().Query()
            .Where(t => t.AccountId == accountId)
            .OrderByDescending(t => t.Date)
            .ThenByDescending(t => t.CreatedAt);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(ToDto).ToList();
        var paged = new PagedResult<TransactionDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<TransactionDto>>.Success(paged));
    }

    [HttpPost("api/preaccounting/accounts/{accountId:guid}/transactions")]
    [HasPermission(Permissions.PreAccounting.Create)]
    public async Task<IActionResult> Create(Guid accountId, [FromBody] CreateTransactionRequest request, CancellationToken ct)
    {
        if (!Enum.IsDefined(request.Type))
            throw new ValidationException("Geçersiz işlem türü.");
        if (!Enum.IsDefined(request.Method))
            throw new ValidationException("Geçersiz ödeme yöntemi.");
        if (request.Amount <= 0)
            throw new ValidationException("Tutar 0'dan büyük olmalıdır.");

        if (!await _uow.Repository<Account>().ExistsAsync(accountId, ct))
            throw new NotFoundException("Cari", accountId);

        var entity = new Transaction
        {
            AccountId = accountId,
            Type = request.Type,
            Direction = DirectionOf(request.Type),
            Amount = request.Amount,
            Date = request.Date,
            Method = request.Method,
            Description = Normalize(request.Description),
            Reference = Normalize(request.Reference),
        };

        await _uow.Repository<Transaction>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result<Guid>.Success(entity.Id, "Hareket eklendi."));
    }

    [HttpDelete("api/preaccounting/transactions/{id:guid}")]
    [HasPermission(Permissions.PreAccounting.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Transaction>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Hareket", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Hareket silindi."));
    }

    /// <summary>Tür → bakiye yönü. Tahsilat/Gelir = Alacak (bakiyeyi azaltır), Ödeme/Gider = Borç.</summary>
    private static TransactionDirection DirectionOf(TransactionType type) => type switch
    {
        TransactionType.Collection => TransactionDirection.Credit,
        TransactionType.Income => TransactionDirection.Credit,
        TransactionType.Payment => TransactionDirection.Debit,
        TransactionType.Expense => TransactionDirection.Debit,
        _ => TransactionDirection.Credit,
    };

    private static TransactionDto ToDto(Transaction t) => new()
    {
        Id = t.Id,
        AccountId = t.AccountId,
        Type = t.Type,
        TypeLabel = PreAccountingLabels.TransactionType(t.Type),
        Direction = t.Direction,
        DirectionLabel = PreAccountingLabels.Direction(t.Direction),
        Amount = t.Amount,
        Date = t.Date,
        Method = t.Method,
        MethodLabel = PreAccountingLabels.Method(t.Method),
        Description = t.Description,
        Reference = t.Reference,
        CreatedAt = t.CreatedAt,
    };

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
