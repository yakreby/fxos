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

/// <summary>Ön muhasebe — cari hesaplar. Bakiye işlemlerden hesaplanır. <c>preaccounting.*</c> izinleri.</summary>
[ApiController]
[Route("api/preaccounting/accounts")]
[Authorize]
public sealed class AccountsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public AccountsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    [HasPermission(Permissions.PreAccounting.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] AccountType? type,
        CancellationToken ct)
    {
        IQueryable<Account> query = _uow.Repository<Account>().Query();

        if (type is not null)
            query = query.Where(a => a.Type == type);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(a =>
                a.Name.Contains(s) ||
                (a.Phone != null && a.Phone.Contains(s)) ||
                (a.TaxNumber != null && a.TaxNumber.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "type" => request.SortDescending ? query.OrderByDescending(a => a.Type) : query.OrderBy(a => a.Type),
            "createdat" => request.SortDescending ? query.OrderByDescending(a => a.CreatedAt) : query.OrderBy(a => a.CreatedAt),
            _ => request.SortDescending ? query.OrderByDescending(a => a.Name) : query.OrderBy(a => a.Name),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var ids = rows.Select(r => r.Id).ToList();
        var nets = await _uow.Repository<Transaction>().Query()
            .Where(t => t.AccountId != null && ids.Contains(t.AccountId.Value))
            .GroupBy(t => t.AccountId!.Value)
            .Select(g => new { Id = g.Key, Net = g.Sum(x => x.Direction == TransactionDirection.Debit ? x.Amount : -x.Amount) })
            .ToDictionaryAsync(x => x.Id, x => x.Net, ct);

        var items = rows.Select(a => new AccountListItemDto
        {
            Id = a.Id,
            Name = a.Name,
            Type = a.Type,
            TypeLabel = PreAccountingLabels.AccountType(a.Type),
            Phone = a.Phone,
            Balance = a.OpeningBalance + nets.GetValueOrDefault(a.Id),
            CreatedAt = a.CreatedAt,
        }).ToList();

        var paged = new PagedResult<AccountListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<AccountListItemDto>>.Success(paged));
    }

    /// <summary>Hafif cari listesi (dropdown'lar için: id + ad + tür). Bakiye hesaplanmaz.</summary>
    [HttpGet("lookup")]
    [HasPermission(Permissions.PreAccounting.View)]
    public async Task<IActionResult> Lookup([FromQuery] AccountType? type, CancellationToken ct)
    {
        IQueryable<Account> query = _uow.Repository<Account>().Query();
        if (type is not null)
            query = query.Where(a => a.Type == type);

        var items = await query
            .OrderBy(a => a.Name)
            .Select(a => new AccountLookupDto
            {
                Id = a.Id,
                Name = a.Name,
                TypeLabel = PreAccountingLabels.AccountType(a.Type),
            })
            .ToListAsync(ct);

        return Ok(Result<IReadOnlyList<AccountLookupDto>>.Success(items));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.PreAccounting.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var a = await _uow.Repository<Account>().GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Cari", id);

        var balance = a.OpeningBalance + await NetAsync(id, ct);

        return Ok(Result<AccountDetailDto>.Success(new AccountDetailDto
        {
            Id = a.Id,
            Name = a.Name,
            Type = a.Type,
            TypeLabel = PreAccountingLabels.AccountType(a.Type),
            TaxNumber = a.TaxNumber,
            Phone = a.Phone,
            Email = a.Email,
            Address = a.Address,
            OpeningBalance = a.OpeningBalance,
            Balance = balance,
            Notes = a.Notes,
            CreatedAt = a.CreatedAt,
        }));
    }

    [HttpPost]
    [HasPermission(Permissions.PreAccounting.Create)]
    public async Task<IActionResult> Create([FromBody] SaveAccountRequest request, CancellationToken ct)
    {
        EnsureTypeValid(request.Type);

        var entity = new Account
        {
            Name = request.Name.Trim(),
            Type = request.Type,
            TaxNumber = Normalize(request.TaxNumber),
            Phone = Normalize(request.Phone),
            Email = Normalize(request.Email),
            Address = Normalize(request.Address),
            OpeningBalance = request.OpeningBalance,
            Notes = Normalize(request.Notes),
        };

        await _uow.Repository<Account>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result<Guid>.Success(entity.Id, "Cari oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.PreAccounting.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveAccountRequest request, CancellationToken ct)
    {
        EnsureTypeValid(request.Type);

        var repo = _uow.Repository<Account>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Cari", id);

        entity.Name = request.Name.Trim();
        entity.Type = request.Type;
        entity.TaxNumber = Normalize(request.TaxNumber);
        entity.Phone = Normalize(request.Phone);
        entity.Email = Normalize(request.Email);
        entity.Address = Normalize(request.Address);
        entity.OpeningBalance = request.OpeningBalance;
        entity.Notes = Normalize(request.Notes);

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Cari güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.PreAccounting.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Account>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Cari", id);

        if (await _uow.Repository<Transaction>().Query().AnyAsync(t => t.AccountId == id, ct))
            throw new BusinessRuleException("Bu cariye ait hareketler var; önce hareketleri silin.");

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Cari silindi."));
    }

    private async Task<decimal> NetAsync(Guid accountId, CancellationToken ct)
    {
        var tx = _uow.Repository<Transaction>().Query().Where(t => t.AccountId == accountId);
        var debit = await tx.Where(t => t.Direction == TransactionDirection.Debit).SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;
        var credit = await tx.Where(t => t.Direction == TransactionDirection.Credit).SumAsync(t => (decimal?)t.Amount, ct) ?? 0m;
        return debit - credit;
    }

    private static void EnsureTypeValid(AccountType type)
    {
        if (!Enum.IsDefined(type))
            throw new ValidationException("Geçersiz cari türü.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
