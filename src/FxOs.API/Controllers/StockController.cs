using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Stock;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Stok durumu (hareketlerden hesaplanır) + stok hareketleri (ledger) + transfer.
/// <c>stock.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/stock")]
[Authorize]
public sealed class StockController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public StockController(IUnitOfWork uow) => _uow = uow;

    /// <summary>Yön + hareket türü seçenekleri (form/filtre).</summary>
    [HttpGet("meta")]
    [HasPermission(Permissions.Stock.View)]
    public IActionResult Meta()
        => Ok(Result<StockMetaDto>.Success(new StockMetaDto
        {
            Directions = StockLabels.Directions,
            MovementTypes = StockLabels.MovementTypes,
        }));

    /// <summary>Ürün bazında eldeki stok (net ≠ 0). Filtre: shelfId, search.</summary>
    [HttpGet]
    [HasPermission(Permissions.Stock.View)]
    public async Task<IActionResult> Current([FromQuery] Guid? shelfId, [FromQuery] string? search, CancellationToken ct)
    {
        IQueryable<StockMovement> q = _uow.Repository<StockMovement>().Query();
        if (shelfId is not null)
            q = q.Where(m => m.ShelfId == shelfId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            q = q.Where(m => m.Product!.ProductCode.Contains(s) || m.Product!.Name.Contains(s));
        }

        var agg = await q.GroupBy(m => m.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                Qty = g.Sum(x => x.Direction == StockDirection.In ? x.Quantity : -x.Quantity),
                Weight = g.Sum(x => x.Direction == StockDirection.In ? (x.Weight ?? 0m) : -(x.Weight ?? 0m)),
            })
            .ToListAsync(ct);

        var nonZero = agg.Where(x => x.Qty != 0m).ToList();
        var ids = nonZero.Select(x => x.ProductId).ToList();
        var products = await _uow.Repository<Product>().Query()
            .Where(p => ids.Contains(p.Id))
            .Select(p => new { p.Id, p.ProductCode, p.Name })
            .ToDictionaryAsync(p => p.Id, ct);

        var items = nonZero
            .Select(x =>
            {
                products.TryGetValue(x.ProductId, out var p);
                return new StockItemDto
                {
                    ProductId = x.ProductId,
                    ProductCode = p?.ProductCode ?? string.Empty,
                    ProductName = p?.Name ?? string.Empty,
                    QuantityOnHand = x.Qty,
                    WeightOnHand = x.Weight,
                };
            })
            .OrderBy(x => x.ProductName)
            .ToList();

        return Ok(Result<IReadOnlyList<StockItemDto>>.Success(items));
    }

    /// <summary>Stok hareketleri ledger'ı (server-side). Filtre: productId, shelfId, type.</summary>
    [HttpGet("movements")]
    [HasPermission(Permissions.Stock.View)]
    public async Task<IActionResult> Movements(
        [FromQuery] PaginationRequest request,
        [FromQuery] Guid? productId,
        [FromQuery] Guid? shelfId,
        [FromQuery] StockMovementType? type,
        CancellationToken ct)
    {
        IQueryable<StockMovement> query = _uow.Repository<StockMovement>().Query()
            .Include(m => m.Product)
            .Include(m => m.Shelf);

        if (productId is not null) query = query.Where(m => m.ProductId == productId);
        if (shelfId is not null) query = query.Where(m => m.ShelfId == shelfId);
        if (type is not null) query = query.Where(m => m.Type == type);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(m =>
                m.Product!.ProductCode.Contains(s) ||
                m.Product!.Name.Contains(s) ||
                (m.Reference != null && m.Reference.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "product" => request.SortDescending ? query.OrderByDescending(m => m.Product!.Name) : query.OrderBy(m => m.Product!.Name),
            "quantity" => request.SortDescending ? query.OrderByDescending(m => m.Quantity) : query.OrderBy(m => m.Quantity),
            _ => request.SortDescending ? query.OrderBy(m => m.MovementDate) : query.OrderByDescending(m => m.MovementDate),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(ToListItem).ToList();
        var paged = new PagedResult<StockMovementListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<StockMovementListItemDto>>.Success(paged));
    }

    [HttpPost("movements")]
    [HasPermission(Permissions.Stock.Create)]
    public async Task<IActionResult> CreateMovement([FromBody] SaveStockMovementRequest request, CancellationToken ct)
    {
        EnsureEnumsValid(request.Direction, request.Type);
        await EnsureProductAsync(request.ProductId, ct);
        await EnsureShelfAsync(request.ShelfId, ct);

        var entity = new StockMovement
        {
            ProductId = request.ProductId,
            ShelfId = request.ShelfId,
            Direction = request.Direction,
            Type = request.Type,
            Quantity = request.Quantity,
            Weight = request.Weight,
            MovementDate = request.MovementDate,
            Reference = Normalize(request.Reference),
            Note = Normalize(request.Note),
        };
        await _uow.Repository<StockMovement>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Stok hareketi eklendi."));
    }

    [HttpPost("transfer")]
    [HasPermission(Permissions.Stock.Create)]
    public async Task<IActionResult> Transfer([FromBody] TransferRequest request, CancellationToken ct)
    {
        if (request.FromShelfId == request.ToShelfId)
            throw new ValidationException("Kaynak ve hedef raf farklı olmalıdır.");

        await EnsureProductAsync(request.ProductId, ct);
        await EnsureShelfAsync(request.FromShelfId, ct);
        await EnsureShelfAsync(request.ToShelfId, ct);

        var repo = _uow.Repository<StockMovement>();
        var note = Normalize(request.Note);

        await repo.AddAsync(new StockMovement
        {
            ProductId = request.ProductId,
            ShelfId = request.FromShelfId,
            Direction = StockDirection.Out,
            Type = StockMovementType.Transfer,
            Quantity = request.Quantity,
            Weight = request.Weight,
            MovementDate = request.MovementDate,
            Note = note,
        }, ct);

        await repo.AddAsync(new StockMovement
        {
            ProductId = request.ProductId,
            ShelfId = request.ToShelfId,
            Direction = StockDirection.In,
            Type = StockMovementType.Transfer,
            Quantity = request.Quantity,
            Weight = request.Weight,
            MovementDate = request.MovementDate,
            Note = note,
        }, ct);

        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Transfer yapıldı."));
    }

    [HttpDelete("movements/{id:guid}")]
    [HasPermission(Permissions.Stock.Delete)]
    public async Task<IActionResult> DeleteMovement(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<StockMovement>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Stok hareketi", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Stok hareketi silindi."));
    }

    private static StockMovementListItemDto ToListItem(StockMovement m) => new()
    {
        Id = m.Id,
        ProductId = m.ProductId,
        ProductCode = m.Product?.ProductCode ?? string.Empty,
        ProductName = m.Product?.Name ?? string.Empty,
        ShelfId = m.ShelfId,
        ShelfCode = m.Shelf?.Code,
        Direction = m.Direction,
        DirectionLabel = StockLabels.Direction(m.Direction),
        Type = m.Type,
        TypeLabel = StockLabels.MovementType(m.Type),
        Quantity = m.Quantity,
        Weight = m.Weight,
        MovementDate = m.MovementDate,
        Reference = m.Reference,
        Note = m.Note,
        CreatedAt = m.CreatedAt,
    };

    private async Task EnsureProductAsync(Guid productId, CancellationToken ct)
    {
        if (!await _uow.Repository<Product>().ExistsAsync(productId, ct))
            throw new ValidationException("Seçilen ürün bulunamadı.");
    }

    private async Task EnsureShelfAsync(Guid? shelfId, CancellationToken ct)
    {
        if (shelfId is Guid sId && !await _uow.Repository<Shelf>().ExistsAsync(sId, ct))
            throw new ValidationException("Seçilen raf bulunamadı.");
    }

    private static void EnsureEnumsValid(StockDirection direction, StockMovementType type)
    {
        if (!Enum.IsDefined(direction)) throw new ValidationException("Geçersiz hareket yönü.");
        if (!Enum.IsDefined(type)) throw new ValidationException("Geçersiz hareket türü.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
