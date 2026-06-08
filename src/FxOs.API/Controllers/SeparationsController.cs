using FxOs.API.Authorization;
using FxOs.API.Common;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Export;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Separations;
using FxOs.Domain.Definitions;
using FxOs.Domain.Products;
using FxOs.Domain.Separations;
using FxOs.Domain.Stock;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;

namespace FxOs.API.Controllers;

/// <summary>
/// Separasyon (ayrıştırma) talebi yönetimi: talep + durum akışı (başlat/tamamla/iptal).
/// İçerik/işlem/sonuç lookup'ları Definition FK'leridir (tür-uyumu doğrulanır); işlem personele
/// damgalanır (performans). <c>separations.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/separations")]
[Authorize]
public sealed class SeparationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IExportService _export;

    public SeparationsController(IUnitOfWork uow, IExportService export)
    {
        _uow = uow;
        _export = export;
    }

    /// <summary>Durum seçenekleri (form/filtre dropdown'ı).</summary>
    [HttpGet("statuses")]
    [HasPermission(Permissions.Separations.View)]
    public IActionResult Statuses()
        => Ok(Result<IReadOnlyList<SeparationStatusOption>>.Success(SeparationStatusLabels.All));

    [HttpGet]
    [HasPermission(Permissions.Separations.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] SeparationStatus? status,
        CancellationToken ct)
    {
        IQueryable<SeparationRequest> query = _uow.Repository<SeparationRequest>().Query()
            .Include(s => s.AssignedPersonnel)
            .Include(s => s.ProcessType)
            .Include(s => s.WasteType);

        if (status is not null)
            query = query.Where(s => s.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(s =>
                s.RequestNumber.Contains(term) ||
                (s.Content != null && s.Content.Contains(term)) ||
                (s.AssignedPersonnel != null && (s.AssignedPersonnel.FirstName.Contains(term) || s.AssignedPersonnel.LastName.Contains(term))));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "requestnumber" => request.SortDescending ? query.OrderByDescending(s => s.RequestNumber) : query.OrderBy(s => s.RequestNumber),
            "status" => request.SortDescending ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "palletcount" => request.SortDescending ? query.OrderByDescending(s => s.PalletCount) : query.OrderBy(s => s.PalletCount),
            "createdat" => request.SortDescending ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => request.SortDescending ? query.OrderBy(s => s.RequestDate) : query.OrderByDescending(s => s.RequestDate),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(s => new SeparationListItemDto
        {
            Id = s.Id,
            RequestNumber = s.RequestNumber,
            RequestDate = s.RequestDate,
            Status = s.Status,
            StatusLabel = SeparationStatusLabels.Of(s.Status),
            AssignedPersonnelId = s.AssignedPersonnelId,
            AssignedPersonnelName = s.AssignedPersonnel == null ? null : s.AssignedPersonnel.FullName,
            ProcessTypeName = s.ProcessType?.Name,
            WasteTypeName = s.WasteType?.Name,
            Content = s.Content,
            PalletCount = s.PalletCount,
            Weight = s.Weight,
            CreatedAt = s.CreatedAt,
        }).ToList();

        var paged = new PagedResult<SeparationListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<SeparationListItemDto>>.Success(paged));
    }

    /// <summary>Separasyon listesini tarih (talep) aralığına göre CSV/Excel/PDF dışa aktarır.</summary>
    [HttpGet("export")]
    [HasPermission(Permissions.Separations.View)]
    public async Task<IActionResult> Export(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] SeparationStatus? status,
        [FromQuery] string? format,
        CancellationToken ct)
    {
        IQueryable<SeparationRequest> query = _uow.Repository<SeparationRequest>().Query()
            .Include(s => s.AssignedPersonnel).Include(s => s.ProcessType).Include(s => s.WasteType).Include(s => s.ResultGroup);
        if (status is not null) query = query.Where(s => s.Status == status);
        if (from is not null) query = query.Where(s => s.RequestDate >= from);
        var toEnd = ExportHelpers.EndOfDay(to);
        if (toEnd is not null) query = query.Where(s => s.RequestDate <= toEnd);
        query = query.OrderByDescending(s => s.RequestDate);

        var rows = await query.ToListAsync(ct);

        var table = new ExportTable
        {
            Title = "Separasyon",
            Subtitle = ExportHelpers.DateRangeLabel(from, to),
            Columns = new[]
            {
                new ExportColumn("Talep No"),
                new ExportColumn("Tarih"),
                new ExportColumn("Personel"),
                new ExportColumn("İşlem Türü"),
                new ExportColumn("Atık Tipi"),
                new ExportColumn("Sonuç Grubu"),
                new ExportColumn("Palet", ExportAlign.Right),
                new ExportColumn("Ağırlık (KG)", ExportAlign.Right),
                new ExportColumn("Durum"),
            },
            Rows = rows.Select(s => (IReadOnlyList<string?>)new string?[]
            {
                s.RequestNumber,
                ExportHelpers.Date(s.RequestDate),
                s.AssignedPersonnel?.FullName,
                s.ProcessType?.Name,
                s.WasteType?.Name,
                s.ResultGroup?.Name,
                ExportHelpers.Int(s.PalletCount),
                ExportHelpers.Num(s.Weight),
                SeparationStatusLabels.Of(s.Status),
            }).ToList(),
        };

        var file = _export.Generate(table, ExportHelpers.ParseFormat(format));
        return File(file.Content, file.ContentType, ExportHelpers.FileName("separasyon", file.FileExtension));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Separations.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var s = await _uow.Repository<SeparationRequest>().Query()
            .Include(x => x.AssignedPersonnel)
            .Include(x => x.WasteType)
            .Include(x => x.ProcessType)
            .Include(x => x.ResultGroup)
            .Include(x => x.Product)
            .Include(x => x.Shelf)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Separasyon talebi", id);

        return Ok(Result<SeparationDetailDto>.Success(ToDetail(s)));
    }

    [HttpPost]
    [HasPermission(Permissions.Separations.Create)]
    public async Task<IActionResult> Create([FromBody] SaveSeparationRequest request, CancellationToken ct)
    {
        await ValidateReferencesAsync(request, ct);

        var entity = new SeparationRequest
        {
            RequestNumber = await ResolveNumberAsync(request.RequestNumber, null, ct),
            RequestDate = request.RequestDate,
            Status = SeparationStatus.Pending,
            AssignedPersonnelId = request.AssignedPersonnelId,
            WasteTypeId = request.WasteTypeId,
            ProcessTypeId = request.ProcessTypeId,
            ResultGroupId = request.ResultGroupId,
            ProductId = request.ProductId,
            ShelfId = request.ShelfId,
            Content = Normalize(request.Content),
            PalletCount = request.PalletCount,
            Weight = request.Weight,
            Notes = Normalize(request.Notes),
        };

        await _uow.Repository<SeparationRequest>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Separasyon talebi oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Separations.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveSeparationRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<SeparationRequest>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Separasyon talebi", id);

        EnsureEditable(entity);
        await ValidateReferencesAsync(request, ct);

        entity.RequestNumber = await ResolveNumberAsync(request.RequestNumber, id, ct);
        entity.RequestDate = request.RequestDate;
        entity.AssignedPersonnelId = request.AssignedPersonnelId;
        entity.WasteTypeId = request.WasteTypeId;
        entity.ProcessTypeId = request.ProcessTypeId;
        entity.ResultGroupId = request.ResultGroupId;
        entity.ProductId = request.ProductId;
        entity.ShelfId = request.ShelfId;
        entity.Content = Normalize(request.Content);
        entity.PalletCount = request.PalletCount;
        entity.Weight = request.Weight;
        entity.Notes = Normalize(request.Notes);

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Separasyon talebi güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Separations.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<SeparationRequest>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Separasyon talebi", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Separasyon talebi silindi."));
    }

    /* ---- Durum akışı ---- */

    /// <summary>İşlemi başlatır (Beklemede → Ayrıştırılıyor).</summary>
    [HttpPost("{id:guid}/start")]
    [HasPermission(Permissions.Separations.Update)]
    public async Task<IActionResult> Start(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != SeparationStatus.Pending)
            throw new BusinessRuleException("Yalnız bekleyen talep başlatılabilir.");

        entity.Status = SeparationStatus.InProgress;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Separasyon başlatıldı."));
    }

    /// <summary>İşlemi tamamlar (Ayrıştırılıyor → Tamamlandı).</summary>
    [HttpPost("{id:guid}/complete")]
    [HasPermission(Permissions.Separations.Update)]
    public async Task<IActionResult> Complete(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != SeparationStatus.InProgress)
            throw new BusinessRuleException("Yalnız süren talep tamamlanabilir.");

        entity.Status = SeparationStatus.Completed;
        entity.CompletedDate = DateTime.UtcNow;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Separasyon tamamlandı."));
    }

    /// <summary>Tamamlanmış talebi yeniden açar (Tamamlandı → Ayrıştırılıyor): düzeltme için.</summary>
    [HttpPost("{id:guid}/reopen")]
    [HasPermission(Permissions.Separations.Update)]
    public async Task<IActionResult> Reopen(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status != SeparationStatus.Completed)
            throw new BusinessRuleException("Yalnız tamamlanmış talep yeniden açılabilir.");

        entity.Status = SeparationStatus.InProgress;
        entity.CompletedDate = null;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Separasyon yeniden açıldı."));
    }

    /// <summary>Talebi iptal eder (tamamlanmamış talepler).</summary>
    [HttpPost("{id:guid}/cancel")]
    [HasPermission(Permissions.Separations.Update)]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        var entity = await GetForTransitionAsync(id, ct);

        if (entity.Status == SeparationStatus.Completed)
            throw new BusinessRuleException("Tamamlanmış talep iptal edilemez (önce yeniden açın).");
        if (entity.Status == SeparationStatus.Cancelled)
            throw new BusinessRuleException("Talep zaten iptal edilmiş.");

        entity.Status = SeparationStatus.Cancelled;
        await SaveTransitionAsync(entity, ct);

        return Ok(Result.Success("Separasyon talebi iptal edildi."));
    }

    /* ---- Yardımcılar ---- */

    private async Task<SeparationRequest> GetForTransitionAsync(Guid id, CancellationToken ct)
        => await _uow.Repository<SeparationRequest>().GetByIdAsync(id, ct)
           ?? throw new NotFoundException("Separasyon talebi", id);

    private async Task SaveTransitionAsync(SeparationRequest entity, CancellationToken ct)
    {
        _uow.Repository<SeparationRequest>().Update(entity);
        await _uow.SaveChangesAsync(ct);
    }

    private static void EnsureEditable(SeparationRequest entity)
    {
        if (entity.Status is SeparationStatus.Completed or SeparationStatus.Cancelled)
            throw new BusinessRuleException("Tamamlanmış/iptal edilmiş talep düzenlenemez.");
    }

    private static SeparationDetailDto ToDetail(SeparationRequest s) => new()
    {
        Id = s.Id,
        RequestNumber = s.RequestNumber,
        RequestDate = s.RequestDate,
        Status = s.Status,
        StatusLabel = SeparationStatusLabels.Of(s.Status),
        AssignedPersonnelId = s.AssignedPersonnelId,
        AssignedPersonnelName = s.AssignedPersonnel?.FullName,
        WasteTypeId = s.WasteTypeId,
        WasteTypeName = s.WasteType?.Name,
        ProcessTypeId = s.ProcessTypeId,
        ProcessTypeName = s.ProcessType?.Name,
        ResultGroupId = s.ResultGroupId,
        ResultGroupName = s.ResultGroup?.Name,
        ProductId = s.ProductId,
        ProductCode = s.Product?.ProductCode,
        ProductName = s.Product?.Name,
        ShelfId = s.ShelfId,
        ShelfCode = s.Shelf?.Code,
        Content = s.Content,
        PalletCount = s.PalletCount,
        Weight = s.Weight,
        CompletedDate = s.CompletedDate,
        Notes = s.Notes,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt,
    };

    /// <summary>İçerik/işlem/sonuç FK'lerini ve personel/ürün/raf varlığını doğrular.</summary>
    private async Task ValidateReferencesAsync(SaveSeparationRequest request, CancellationToken ct)
    {
        await EnsureDefinitionAsync(request.WasteTypeId, DefinitionType.WasteType, "atık tipi (WasteType)", ct);
        await EnsureDefinitionAsync(request.ProcessTypeId, DefinitionType.ProcessType, "işlem türü (ProcessType)", ct);
        await EnsureDefinitionAsync(request.ResultGroupId, DefinitionType.WasteGroup, "sonuç grubu (WasteGroup)", ct);

        if (request.AssignedPersonnelId is Guid pId && !await _uow.Repository<PersonnelEntity>().ExistsAsync(pId, ct))
            throw new ValidationException("Seçilen personel bulunamadı.");

        if (request.ProductId is Guid prId && !await _uow.Repository<Product>().ExistsAsync(prId, ct))
            throw new ValidationException("Seçilen ürün bulunamadı.");

        if (request.ShelfId is Guid sId && !await _uow.Repository<Shelf>().ExistsAsync(sId, ct))
            throw new ValidationException("Seçilen raf bulunamadı.");
    }

    /// <summary>Definition FK'sinin var olduğunu ve beklenen türde olduğunu doğrular.</summary>
    private async Task EnsureDefinitionAsync(Guid? id, DefinitionType expected, string label, CancellationToken ct)
    {
        if (id is not Guid defId) return;
        var def = await _uow.Repository<Definition>().GetByIdAsync(defId, ct)
            ?? throw new ValidationException($"Seçilen {label} bulunamadı.");
        if (def.Type != expected)
            throw new ValidationException($"Seçilen tanım {label} değil.");
    }

    /// <summary>Talep numarasını çözer: verildiyse benzersizliği doğrular, boşsa otomatik üretir.</summary>
    private async Task<string> ResolveNumberAsync(string? requested, Guid? excludeId, CancellationToken ct)
    {
        var baseQuery = _uow.Repository<SeparationRequest>().Query();
        if (excludeId is { } id)
            baseQuery = baseQuery.Where(s => s.Id != id);

        var number = requested?.Trim();
        if (!string.IsNullOrEmpty(number))
        {
            if (await baseQuery.AnyAsync(s => s.RequestNumber == number, ct))
                throw new ConflictException($"'{number}' numaralı bir separasyon talebi zaten var.");
            return number;
        }

        // Otomatik: SEP-yyyyMMdd-#### (gün içi sıra). Çakışırsa zaman damgasına düş.
        var today = DateTime.UtcNow;
        var prefix = $"SEP-{today:yyyyMMdd}-";
        var todayCount = await _uow.Repository<SeparationRequest>().Query()
            .CountAsync(s => s.RequestNumber.StartsWith(prefix), ct);
        var candidate = $"{prefix}{(todayCount + 1):D4}";
        if (await _uow.Repository<SeparationRequest>().Query().AnyAsync(s => s.RequestNumber == candidate, ct))
            candidate = $"{prefix}{today:HHmmss}";
        return candidate;
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
