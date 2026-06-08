using FxOs.API.Authorization;
using FxOs.API.Common;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Export;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.GoodsReceipts;
using FxOs.Domain.GoodsReceipts;
using FxOs.Domain.PreAccounting;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Mal kabul yönetimi (başlık + satırlar). Satırlar ürüne (Product), başlık tedarikçiye (Account)
/// FK ile bağlanır. <c>goodsreceipts.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/goods-receipts")]
[Authorize]
public sealed class GoodsReceiptsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IExportService _export;

    public GoodsReceiptsController(IUnitOfWork uow, IExportService export)
    {
        _uow = uow;
        _export = export;
    }

    /// <summary>Durum seçenekleri (form/filtre dropdown'ı).</summary>
    [HttpGet("statuses")]
    [HasPermission(Permissions.GoodsReceipts.View)]
    public IActionResult Statuses()
        => Ok(Result<IReadOnlyList<GoodsReceiptStatusOption>>.Success(GoodsReceiptStatusLabels.All));

    [HttpGet]
    [HasPermission(Permissions.GoodsReceipts.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] GoodsReceiptStatus? status,
        CancellationToken ct)
    {
        IQueryable<GoodsReceipt> query = _uow.Repository<GoodsReceipt>().Query()
            .Include(g => g.Supplier);

        if (status is not null)
            query = query.Where(g => g.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(g =>
                g.ReceiptNumber.Contains(s) ||
                (g.Supplier != null && g.Supplier.Name.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "receiptnumber" => request.SortDescending ? query.OrderByDescending(g => g.ReceiptNumber) : query.OrderBy(g => g.ReceiptNumber),
            "supplier" => request.SortDescending ? query.OrderByDescending(g => g.Supplier!.Name) : query.OrderBy(g => g.Supplier!.Name),
            "status" => request.SortDescending ? query.OrderByDescending(g => g.Status) : query.OrderBy(g => g.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(g => g.CreatedAt) : query.OrderBy(g => g.CreatedAt),
            _ => request.SortDescending ? query.OrderBy(g => g.ReceiptDate) : query.OrderByDescending(g => g.ReceiptDate),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var ids = rows.Select(r => r.Id).ToList();
        var agg = await _uow.Repository<GoodsReceiptLine>().Query()
            .Where(l => ids.Contains(l.GoodsReceiptId))
            .GroupBy(l => l.GoodsReceiptId)
            .Select(g => new { Id = g.Key, Count = g.Count(), Qty = g.Sum(x => x.Quantity), Weight = g.Sum(x => x.Weight ?? 0m) })
            .ToDictionaryAsync(x => x.Id, x => x, ct);

        var items = rows.Select(g =>
        {
            agg.TryGetValue(g.Id, out var a);
            return new GoodsReceiptListItemDto
            {
                Id = g.Id,
                ReceiptNumber = g.ReceiptNumber,
                ReceiptDate = g.ReceiptDate,
                SupplierId = g.SupplierId,
                SupplierName = g.Supplier?.Name,
                Status = g.Status,
                StatusLabel = GoodsReceiptStatusLabels.Of(g.Status),
                LineCount = a?.Count ?? 0,
                TotalQuantity = a?.Qty ?? 0m,
                TotalWeight = a?.Weight ?? 0m,
                CreatedAt = g.CreatedAt,
            };
        }).ToList();

        var paged = new PagedResult<GoodsReceiptListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<GoodsReceiptListItemDto>>.Success(paged));
    }

    /// <summary>Mal kabul listesini tarih aralığına göre CSV/Excel/PDF dışa aktarır.</summary>
    [HttpGet("export")]
    [HasPermission(Permissions.GoodsReceipts.View)]
    public async Task<IActionResult> Export(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] GoodsReceiptStatus? status,
        [FromQuery] string? format,
        CancellationToken ct)
    {
        IQueryable<GoodsReceipt> query = _uow.Repository<GoodsReceipt>().Query().Include(g => g.Supplier);
        if (status is not null) query = query.Where(g => g.Status == status);
        if (from is not null) query = query.Where(g => g.ReceiptDate >= from);
        var toEnd = ExportHelpers.EndOfDay(to);
        if (toEnd is not null) query = query.Where(g => g.ReceiptDate <= toEnd);
        query = query.OrderByDescending(g => g.ReceiptDate);

        var rows = await query.ToListAsync(ct);
        var ids = rows.Select(r => r.Id).ToList();
        var agg = await _uow.Repository<GoodsReceiptLine>().Query()
            .Where(l => ids.Contains(l.GoodsReceiptId))
            .GroupBy(l => l.GoodsReceiptId)
            .Select(g => new { Id = g.Key, Count = g.Count(), Qty = g.Sum(x => x.Quantity), Weight = g.Sum(x => x.Weight ?? 0m) })
            .ToDictionaryAsync(x => x.Id, x => x, ct);

        var table = new ExportTable
        {
            Title = "Mal Kabul",
            Subtitle = ExportHelpers.DateRangeLabel(from, to),
            Columns = new[]
            {
                new ExportColumn("Fiş No"),
                new ExportColumn("Tarih"),
                new ExportColumn("Tedarikçi"),
                new ExportColumn("Satır", ExportAlign.Right),
                new ExportColumn("Miktar", ExportAlign.Right),
                new ExportColumn("Tartım (KG)", ExportAlign.Right),
                new ExportColumn("Durum"),
            },
            Rows = rows.Select(g =>
            {
                agg.TryGetValue(g.Id, out var a);
                return (IReadOnlyList<string?>)new string?[]
                {
                    g.ReceiptNumber,
                    ExportHelpers.Date(g.ReceiptDate),
                    g.Supplier?.Name,
                    ExportHelpers.Int(a?.Count ?? 0),
                    ExportHelpers.Num(a?.Qty ?? 0m),
                    ExportHelpers.Num(a?.Weight ?? 0m),
                    GoodsReceiptStatusLabels.Of(g.Status),
                };
            }).ToList(),
        };

        var file = _export.Generate(table, ExportHelpers.ParseFormat(format));
        return File(file.Content, file.ContentType, ExportHelpers.FileName("mal-kabul", file.FileExtension));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.GoodsReceipts.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var g = await _uow.Repository<GoodsReceipt>().Query()
            .Include(x => x.Supplier)
            .Include(x => x.Lines).ThenInclude(l => l.Product)
            .Include(x => x.Lines).ThenInclude(l => l.Shelf)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Mal kabul", id);

        return Ok(Result<GoodsReceiptDetailDto>.Success(ToDetail(g)));
    }

    [HttpPost]
    [HasPermission(Permissions.GoodsReceipts.Create)]
    public async Task<IActionResult> Create([FromBody] SaveGoodsReceiptRequest request, CancellationToken ct)
    {
        await EnsureSupplierAsync(request.SupplierId, ct);

        var number = await ResolveNumberAsync(request.ReceiptNumber, null, ct);

        var entity = new GoodsReceipt
        {
            ReceiptNumber = number,
            ReceiptDate = request.ReceiptDate,
            SupplierId = request.SupplierId,
            Status = GoodsReceiptStatus.Draft,
            Notes = Normalize(request.Notes),
        };

        await _uow.Repository<GoodsReceipt>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Mal kabul oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.GoodsReceipts.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveGoodsReceiptRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceipt>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Mal kabul", id);

        if (entity.Status != GoodsReceiptStatus.Draft)
            throw new BusinessRuleException("Yalnız taslak fişler düzenlenebilir.");

        await EnsureSupplierAsync(request.SupplierId, ct);

        entity.ReceiptNumber = await ResolveNumberAsync(request.ReceiptNumber, id, ct);
        entity.ReceiptDate = request.ReceiptDate;
        entity.SupplierId = request.SupplierId;
        entity.Notes = Normalize(request.Notes);

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Mal kabul güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.GoodsReceipts.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceipt>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Mal kabul", id);

        // Başlıkla birlikte satırları ve (varsa) üretilmiş stok hareketlerini de soft-delete et.
        var lineRepo = _uow.Repository<GoodsReceiptLine>();
        var lines = await lineRepo.Query().Where(l => l.GoodsReceiptId == id).ToListAsync(ct);
        foreach (var line in lines)
            lineRepo.Remove(line);

        await RemoveGeneratedMovementsAsync(id, ct);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Mal kabul silindi."));
    }

    /* ---- Satırlar ---- */

    [HttpPost("{id:guid}/lines")]
    [HasPermission(Permissions.GoodsReceipts.Update)]
    public async Task<IActionResult> AddLine(Guid id, [FromBody] SaveGoodsReceiptLineRequest request, CancellationToken ct)
    {
        var receipt = await _uow.Repository<GoodsReceipt>().GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Mal kabul", id);
        EnsureDraft(receipt);

        if (!await _uow.Repository<Product>().ExistsAsync(request.ProductId, ct))
            throw new ValidationException("Seçilen ürün bulunamadı.");
        await EnsureShelfAsync(request.ShelfId, ct);

        var line = new GoodsReceiptLine
        {
            GoodsReceiptId = id,
            ProductId = request.ProductId,
            ShelfId = request.ShelfId,
            Quantity = request.Quantity,
            Weight = request.Weight,
            Note = Normalize(request.Note),
        };

        await _uow.Repository<GoodsReceiptLine>().AddAsync(line, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(line.Id, "Satır eklendi."));
    }

    [HttpDelete("lines/{lineId:guid}")]
    [HasPermission(Permissions.GoodsReceipts.Update)]
    public async Task<IActionResult> DeleteLine(Guid lineId, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceiptLine>();
        var line = await repo.GetByIdAsync(lineId, ct) ?? throw new NotFoundException("Satır", lineId);

        var receipt = await _uow.Repository<GoodsReceipt>().GetByIdAsync(line.GoodsReceiptId, ct);
        if (receipt is not null) EnsureDraft(receipt);

        repo.Remove(line);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Satır silindi."));
    }

    /* ---- Durum akışı (onay = stok girişi) ---- */

    /// <summary>Taslak fişi onaylar: her satır için stok girişi (Giriş/Mal Kabul) üretir.</summary>
    [HttpPost("{id:guid}/confirm")]
    [HasPermission(Permissions.GoodsReceipts.Update)]
    public async Task<IActionResult> Confirm(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceipt>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Mal kabul", id);

        if (entity.Status != GoodsReceiptStatus.Draft)
            throw new BusinessRuleException("Yalnız taslak fişler onaylanabilir.");

        var lines = await _uow.Repository<GoodsReceiptLine>().Query()
            .Where(l => l.GoodsReceiptId == id).ToListAsync(ct);
        if (lines.Count == 0)
            throw new BusinessRuleException("Onaylamak için en az bir satır eklemelisiniz.");

        var moveRepo = _uow.Repository<StockMovement>();
        foreach (var line in lines)
        {
            await moveRepo.AddAsync(new StockMovement
            {
                ProductId = line.ProductId,
                ShelfId = line.ShelfId,
                Direction = StockDirection.In,
                Type = StockMovementType.Receipt,
                Quantity = line.Quantity,
                Weight = line.Weight,
                MovementDate = entity.ReceiptDate,
                Reference = entity.ReceiptNumber,
                GoodsReceiptId = entity.Id,
                Note = "Mal kabul onayı",
            }, ct);
        }

        entity.Status = GoodsReceiptStatus.Confirmed;
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Mal kabul onaylandı; stok girişi yapıldı."));
    }

    /// <summary>Fişi iptal eder; onaylanmışsa üretilmiş stok hareketlerini geri alır.</summary>
    [HttpPost("{id:guid}/cancel")]
    [HasPermission(Permissions.GoodsReceipts.Update)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceipt>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Mal kabul", id);

        if (entity.Status == GoodsReceiptStatus.Cancelled)
            throw new BusinessRuleException("Fiş zaten iptal edilmiş.");

        await RemoveGeneratedMovementsAsync(id, ct);

        entity.Status = GoodsReceiptStatus.Cancelled;
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Mal kabul iptal edildi."));
    }

    /* ---- Yardımcılar ---- */

    private static GoodsReceiptDetailDto ToDetail(GoodsReceipt g)
    {
        var lines = g.Lines
            .OrderBy(l => l.CreatedAt)
            .Select(l => new GoodsReceiptLineDto
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductCode = l.Product?.ProductCode ?? string.Empty,
                ProductName = l.Product?.Name ?? string.Empty,
                ShelfId = l.ShelfId,
                ShelfCode = l.Shelf?.Code,
                Quantity = l.Quantity,
                Weight = l.Weight,
                Note = l.Note,
            })
            .ToList();

        return new GoodsReceiptDetailDto
        {
            Id = g.Id,
            ReceiptNumber = g.ReceiptNumber,
            ReceiptDate = g.ReceiptDate,
            SupplierId = g.SupplierId,
            SupplierName = g.Supplier?.Name,
            Status = g.Status,
            StatusLabel = GoodsReceiptStatusLabels.Of(g.Status),
            Notes = g.Notes,
            TotalQuantity = lines.Sum(l => l.Quantity),
            TotalWeight = lines.Sum(l => l.Weight ?? 0m),
            CreatedAt = g.CreatedAt,
            UpdatedAt = g.UpdatedAt,
            Lines = lines,
        };
    }

    /// <summary>Fiş numarasını çözer: verildiyse benzersizliği doğrular, boşsa otomatik üretir.</summary>
    private async Task<string> ResolveNumberAsync(string? requested, Guid? excludeId, CancellationToken ct)
    {
        var repo = _uow.Repository<GoodsReceipt>().Query();
        if (excludeId is { } id)
            repo = repo.Where(g => g.Id != id);

        var number = requested?.Trim();
        if (!string.IsNullOrEmpty(number))
        {
            if (await repo.AnyAsync(g => g.ReceiptNumber == number, ct))
                throw new ConflictException($"'{number}' numaralı bir mal kabul zaten var.");
            return number;
        }

        // Otomatik: MK-yyyyMMdd-#### (gün içi sıra). Çakışırsa zaman damgasına düş.
        var today = DateTime.UtcNow;
        var prefix = $"MK-{today:yyyyMMdd}-";
        var todayCount = await _uow.Repository<GoodsReceipt>().Query()
            .CountAsync(g => g.ReceiptNumber.StartsWith(prefix), ct);
        var candidate = $"{prefix}{(todayCount + 1):D4}";
        if (await _uow.Repository<GoodsReceipt>().Query().AnyAsync(g => g.ReceiptNumber == candidate, ct))
            candidate = $"{prefix}{today:HHmmss}";
        return candidate;
    }

    private async Task EnsureSupplierAsync(Guid? supplierId, CancellationToken ct)
    {
        if (supplierId is Guid sId && !await _uow.Repository<Account>().ExistsAsync(sId, ct))
            throw new ValidationException("Seçilen tedarikçi bulunamadı.");
    }

    private async Task EnsureShelfAsync(Guid? shelfId, CancellationToken ct)
    {
        if (shelfId is Guid sId && !await _uow.Repository<Shelf>().ExistsAsync(sId, ct))
            throw new ValidationException("Seçilen raf bulunamadı.");
    }

    private static void EnsureDraft(GoodsReceipt receipt)
    {
        if (receipt.Status != GoodsReceiptStatus.Draft)
            throw new BusinessRuleException("Yalnız taslak fişin satırları değiştirilebilir.");
    }

    /// <summary>Bu fişin onayında üretilmiş stok hareketlerini soft-delete eder (geri alma).</summary>
    private async Task RemoveGeneratedMovementsAsync(Guid receiptId, CancellationToken ct)
    {
        var moveRepo = _uow.Repository<StockMovement>();
        var moves = await moveRepo.Query().Where(m => m.GoodsReceiptId == receiptId).ToListAsync(ct);
        foreach (var m in moves)
            moveRepo.Remove(m);
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
