using FxOs.API.Authorization;
using FxOs.API.Common;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Export;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Octabins;
using FxOs.Domain.Definitions;
using FxOs.Domain.Octabins;
using FxOs.Domain.Products;
using FxOs.Domain.Stock;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Octabin (büyük konteyner) yönetimi: aç/kapat/sevk + durum akışı. İçerik esnek
/// (atık tipi Definition FK ve/veya ürün ve/veya serbest metin). <c>octabins.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/octabins")]
[Authorize]
public sealed class OctabinsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IExportService _export;

    public OctabinsController(IUnitOfWork uow, IExportService export)
    {
        _uow = uow;
        _export = export;
    }

    /// <summary>Durum seçenekleri (form/filtre dropdown'ı).</summary>
    [HttpGet("statuses")]
    [HasPermission(Permissions.Octabins.View)]
    public IActionResult Statuses()
        => Ok(Result<IReadOnlyList<OctabinStatusOption>>.Success(OctabinStatusLabels.All));

    [HttpGet]
    [HasPermission(Permissions.Octabins.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] OctabinStatus? status,
        CancellationToken ct)
    {
        IQueryable<Octabin> query = _uow.Repository<Octabin>().Query()
            .Include(o => o.WasteType)
            .Include(o => o.Product)
            .Include(o => o.Shelf);

        if (status is not null)
            query = query.Where(o => o.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(o =>
                o.OctabinNumber.Contains(s) ||
                (o.Content != null && o.Content.Contains(s)) ||
                (o.Product != null && o.Product.Name.Contains(s)) ||
                (o.WasteType != null && o.WasteType.Name.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "octabinnumber" => request.SortDescending ? query.OrderByDescending(o => o.OctabinNumber) : query.OrderBy(o => o.OctabinNumber),
            "status" => request.SortDescending ? query.OrderByDescending(o => o.Status) : query.OrderBy(o => o.Status),
            "netweight" => request.SortDescending ? query.OrderByDescending(o => o.NetWeight) : query.OrderBy(o => o.NetWeight),
            "createdat" => request.SortDescending ? query.OrderByDescending(o => o.CreatedAt) : query.OrderBy(o => o.CreatedAt),
            _ => request.SortDescending ? query.OrderBy(o => o.OpenedDate) : query.OrderByDescending(o => o.OpenedDate),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(o => new OctabinListItemDto
        {
            Id = o.Id,
            OctabinNumber = o.OctabinNumber,
            Status = o.Status,
            StatusLabel = OctabinStatusLabels.Of(o.Status),
            WasteTypeName = o.WasteType?.Name,
            ProductCode = o.Product?.ProductCode,
            ProductName = o.Product?.Name,
            Content = o.Content,
            ShelfCode = o.Shelf?.Code,
            Capacity = o.Capacity,
            NetWeight = o.NetWeight,
            FillPercent = FillPercent(o.NetWeight, o.Capacity),
            OpenedDate = o.OpenedDate,
            CreatedAt = o.CreatedAt,
        }).ToList();

        var paged = new PagedResult<OctabinListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<OctabinListItemDto>>.Success(paged));
    }

    /// <summary>Octabin listesini tarih (açılış) aralığına göre CSV/Excel/PDF dışa aktarır.</summary>
    [HttpGet("export")]
    [HasPermission(Permissions.Octabins.View)]
    public async Task<IActionResult> Export(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] OctabinStatus? status,
        [FromQuery] string? format,
        CancellationToken ct)
    {
        IQueryable<Octabin> query = _uow.Repository<Octabin>().Query()
            .Include(o => o.WasteType).Include(o => o.Product).Include(o => o.Shelf);
        if (status is not null) query = query.Where(o => o.Status == status);
        if (from is not null) query = query.Where(o => o.OpenedDate >= from);
        var toEnd = ExportHelpers.EndOfDay(to);
        if (toEnd is not null) query = query.Where(o => o.OpenedDate <= toEnd);
        query = query.OrderByDescending(o => o.OpenedDate);

        var rows = await query.ToListAsync(ct);

        var table = new ExportTable
        {
            Title = "Octabin",
            Subtitle = ExportHelpers.DateRangeLabel(from, to),
            Columns = new[]
            {
                new ExportColumn("Octabin No"),
                new ExportColumn("Açılış"),
                new ExportColumn("İçerik"),
                new ExportColumn("Raf"),
                new ExportColumn("Kapasite (KG)", ExportAlign.Right),
                new ExportColumn("Net Ağırlık (KG)", ExportAlign.Right),
                new ExportColumn("Durum"),
            },
            Rows = rows.Select(o => (IReadOnlyList<string?>)new string?[]
            {
                o.OctabinNumber,
                ExportHelpers.Date(o.OpenedDate),
                o.WasteType?.Name ?? o.Product?.Name ?? o.Content,
                o.Shelf?.Code,
                ExportHelpers.Num(o.Capacity),
                ExportHelpers.Num(o.NetWeight),
                OctabinStatusLabels.Of(o.Status),
            }).ToList(),
        };

        var file = _export.Generate(table, ExportHelpers.ParseFormat(format));
        return File(file.Content, file.ContentType, ExportHelpers.FileName("octabin", file.FileExtension));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Octabins.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var o = await _uow.Repository<Octabin>().Query()
            .Include(x => x.WasteType)
            .Include(x => x.Product)
            .Include(x => x.Shelf)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Octabin", id);

        return Ok(Result<OctabinDetailDto>.Success(ToDetail(o)));
    }

    [HttpPost]
    [HasPermission(Permissions.Octabins.Create)]
    public async Task<IActionResult> Create([FromBody] SaveOctabinRequest request, CancellationToken ct)
    {
        await ValidateContentAsync(request, ct);

        var entity = new Octabin
        {
            OctabinNumber = await ResolveNumberAsync(request.OctabinNumber, null, ct),
            Status = OctabinStatus.Open,
            OpenedDate = request.OpenedDate,
            WasteTypeId = request.WasteTypeId,
            ProductId = request.ProductId,
            Content = Normalize(request.Content),
            ShelfId = request.ShelfId,
            Capacity = request.Capacity,
            NetWeight = request.NetWeight,
            Notes = Normalize(request.Notes),
        };

        await _uow.Repository<Octabin>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Octabin oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Octabins.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveOctabinRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<Octabin>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Octabin", id);

        if (entity.Status == OctabinStatus.Dispatched)
            throw new BusinessRuleException("Sevk edilmiş octabin düzenlenemez.");

        await ValidateContentAsync(request, ct);

        entity.OctabinNumber = await ResolveNumberAsync(request.OctabinNumber, id, ct);
        entity.OpenedDate = request.OpenedDate;
        entity.WasteTypeId = request.WasteTypeId;
        entity.ProductId = request.ProductId;
        entity.Content = Normalize(request.Content);
        entity.ShelfId = request.ShelfId;
        entity.Capacity = request.Capacity;
        entity.NetWeight = request.NetWeight;
        entity.Notes = Normalize(request.Notes);

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Octabin güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Octabins.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Octabin>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Octabin", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Octabin silindi."));
    }

    /* ---- Durum akışı ---- */

    /// <summary>Octabin'i kapatır (Açık → Dolu): sevke hazır.</summary>
    [HttpPost("{id:guid}/close")]
    [HasPermission(Permissions.Octabins.Update)]
    public async Task<IActionResult> Close(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != OctabinStatus.Open)
            throw new BusinessRuleException("Yalnız açık octabin kapatılabilir.");

        entity.Status = OctabinStatus.Full;
        entity.ClosedDate = DateTime.UtcNow;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Octabin kapatıldı (dolu)."));
    }

    /// <summary>Octabin'i yeniden açar (Dolu → Açık): düzeltme için.</summary>
    [HttpPost("{id:guid}/reopen")]
    [HasPermission(Permissions.Octabins.Update)]
    public async Task<IActionResult> Reopen(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != OctabinStatus.Full)
            throw new BusinessRuleException("Yalnız dolu octabin yeniden açılabilir.");

        entity.Status = OctabinStatus.Open;
        entity.ClosedDate = null;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Octabin yeniden açıldı."));
    }

    /// <summary>Octabin'i sevk eder (Dolu → Sevk Edildi).</summary>
    [HttpPost("{id:guid}/dispatch")]
    [HasPermission(Permissions.Octabins.Update)]
    public async Task<IActionResult> Dispatch(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != OctabinStatus.Full)
            throw new BusinessRuleException("Sevk için octabin önce kapatılmalıdır (dolu).");

        entity.Status = OctabinStatus.Dispatched;
        entity.DispatchedDate = DateTime.UtcNow;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Octabin sevk edildi."));
    }

    /* ---- Yardımcılar ---- */

    private async Task<Octabin> GetForTransitionAsync(Guid id, CancellationToken ct)
        => await _uow.Repository<Octabin>().GetByIdAsync(id, ct) ?? throw new NotFoundException("Octabin", id);

    private async Task SaveTransitionAsync(Octabin entity, CancellationToken ct)
    {
        _uow.Repository<Octabin>().Update(entity);
        await _uow.SaveChangesAsync(ct);
    }

    private static OctabinDetailDto ToDetail(Octabin o) => new()
    {
        Id = o.Id,
        OctabinNumber = o.OctabinNumber,
        Status = o.Status,
        StatusLabel = OctabinStatusLabels.Of(o.Status),
        WasteTypeId = o.WasteTypeId,
        WasteTypeName = o.WasteType?.Name,
        ProductId = o.ProductId,
        ProductCode = o.Product?.ProductCode,
        ProductName = o.Product?.Name,
        Content = o.Content,
        ShelfId = o.ShelfId,
        ShelfCode = o.Shelf?.Code,
        Capacity = o.Capacity,
        NetWeight = o.NetWeight,
        FillPercent = FillPercent(o.NetWeight, o.Capacity),
        OpenedDate = o.OpenedDate,
        ClosedDate = o.ClosedDate,
        DispatchedDate = o.DispatchedDate,
        Notes = o.Notes,
        CreatedAt = o.CreatedAt,
        UpdatedAt = o.UpdatedAt,
    };

    /// <summary>Doluluk yüzdesi (0–100, iki ondalık); kapasite yoksa/0 ise null.</summary>
    private static decimal? FillPercent(decimal? netWeight, decimal? capacity)
    {
        if (capacity is not > 0m) return null;
        return Math.Round((netWeight ?? 0m) / capacity.Value * 100m, 2);
    }

    /// <summary>İçerik FK'lerinin geçerliliğini doğrular (WasteType tür-uyumu + ürün/raf varlığı).</summary>
    private async Task ValidateContentAsync(SaveOctabinRequest request, CancellationToken ct)
    {
        if (request.WasteTypeId is Guid wtId)
        {
            var def = await _uow.Repository<Definition>().GetByIdAsync(wtId, ct)
                ?? throw new ValidationException("Seçilen atık tipi bulunamadı.");
            if (def.Type != DefinitionType.WasteType)
                throw new ValidationException("Seçilen tanım atık tipi (WasteType) değil.");
        }

        if (request.ProductId is Guid pId && !await _uow.Repository<Product>().ExistsAsync(pId, ct))
            throw new ValidationException("Seçilen ürün bulunamadı.");

        if (request.ShelfId is Guid sId && !await _uow.Repository<Shelf>().ExistsAsync(sId, ct))
            throw new ValidationException("Seçilen raf bulunamadı.");
    }

    /// <summary>Octabin numarasını çözer: verildiyse benzersizliği doğrular, boşsa otomatik üretir.</summary>
    private async Task<string> ResolveNumberAsync(string? requested, Guid? excludeId, CancellationToken ct)
    {
        var baseQuery = _uow.Repository<Octabin>().Query();
        if (excludeId is { } id)
            baseQuery = baseQuery.Where(o => o.Id != id);

        var number = requested?.Trim();
        if (!string.IsNullOrEmpty(number))
        {
            if (await baseQuery.AnyAsync(o => o.OctabinNumber == number, ct))
                throw new ConflictException($"'{number}' numaralı bir octabin zaten var.");
            return number;
        }

        // Otomatik: OCT-yyyyMMdd-#### (gün içi sıra). Çakışırsa zaman damgasına düş.
        var today = DateTime.UtcNow;
        var prefix = $"OCT-{today:yyyyMMdd}-";
        var todayCount = await _uow.Repository<Octabin>().Query()
            .CountAsync(o => o.OctabinNumber.StartsWith(prefix), ct);
        var candidate = $"{prefix}{(todayCount + 1):D4}";
        if (await _uow.Repository<Octabin>().Query().AnyAsync(o => o.OctabinNumber == candidate, ct))
            candidate = $"{prefix}{today:HHmmss}";
        return candidate;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
