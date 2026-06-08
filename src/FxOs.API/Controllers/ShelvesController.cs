using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Stock;
using FxOs.Domain.Stock;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>Raf/lokasyon yönetimi + doluluk (hareketlerden hesaplanır). <c>shelves.*</c> izinleri.</summary>
[ApiController]
[Route("api/shelves")]
[Authorize]
public sealed class ShelvesController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ShelvesController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    [HasPermission(Permissions.Shelves.View)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var shelves = await _uow.Repository<Shelf>().Query().OrderBy(s => s.Code).ToListAsync(ct);

        // Raf × ürün bazında net miktar/ağırlık; sonra rafa göre topla.
        var perShelfProduct = await _uow.Repository<StockMovement>().Query()
            .Where(m => m.ShelfId != null)
            .GroupBy(m => new { ShelfId = m.ShelfId!.Value, m.ProductId })
            .Select(g => new
            {
                g.Key.ShelfId,
                Qty = g.Sum(x => x.Direction == StockDirection.In ? x.Quantity : -x.Quantity),
                Weight = g.Sum(x => x.Direction == StockDirection.In ? (x.Weight ?? 0m) : -(x.Weight ?? 0m)),
            })
            .ToListAsync(ct);

        var byShelf = perShelfProduct
            .GroupBy(x => x.ShelfId)
            .ToDictionary(g => g.Key, g => new
            {
                Qty = g.Sum(x => x.Qty),
                Weight = g.Sum(x => x.Weight),
                Count = g.Count(x => x.Qty != 0),
            });

        var items = shelves.Select(s =>
        {
            byShelf.TryGetValue(s.Id, out var a);
            return new ShelfDto
            {
                Id = s.Id,
                Code = s.Code,
                Name = s.Name,
                Capacity = s.Capacity,
                IsActive = s.IsActive,
                Notes = s.Notes,
                QuantityOnHand = a?.Qty ?? 0m,
                WeightOnHand = a?.Weight ?? 0m,
                ProductCount = a?.Count ?? 0,
            };
        }).ToList();

        return Ok(Result<IReadOnlyList<ShelfDto>>.Success(items));
    }

    [HttpPost]
    [HasPermission(Permissions.Shelves.Create)]
    public async Task<IActionResult> Create([FromBody] SaveShelfRequest request, CancellationToken ct)
    {
        var code = request.Code.Trim();
        if (await _uow.Repository<Shelf>().Query().AnyAsync(s => s.Code == code, ct))
            throw new ConflictException($"'{code}' kodlu bir raf zaten var.");

        var entity = new Shelf
        {
            Code = code,
            Name = request.Name.Trim(),
            Capacity = request.Capacity,
            IsActive = request.IsActive,
            Notes = Normalize(request.Notes),
        };
        await _uow.Repository<Shelf>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Raf oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Shelves.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveShelfRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<Shelf>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Raf", id);

        var code = request.Code.Trim();
        if (await repo.Query().AnyAsync(s => s.Id != id && s.Code == code, ct))
            throw new ConflictException($"'{code}' kodlu bir raf zaten var.");

        entity.Code = code;
        entity.Name = request.Name.Trim();
        entity.Capacity = request.Capacity;
        entity.IsActive = request.IsActive;
        entity.Notes = Normalize(request.Notes);
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Raf güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Shelves.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Shelf>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Raf", id);

        if (await _uow.Repository<StockMovement>().Query().AnyAsync(m => m.ShelfId == id, ct))
            throw new BusinessRuleException("Bu rafa ait stok hareketleri var; önce hareketleri kaldırın.");

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Raf silindi."));
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
