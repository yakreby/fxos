using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Products;
using FxOs.Domain.Definitions;
using FxOs.Domain.PreAccounting;
using FxOs.Domain.Products;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Ürün kartı yönetimi. Grup/tür alanları <see cref="Definition"/> FK'leriyle (type-safe) bağlanır;
/// müşteri cari (Account) FK'sidir. <c>products.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/products")]
[Authorize]
public sealed class ProductsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public ProductsController(IUnitOfWork uow) => _uow = uow;

    /// <summary>PackageType seçenekleri (form dropdown'ı).</summary>
    [HttpGet("package-types")]
    [HasPermission(Permissions.Products.View)]
    public IActionResult PackageTypes()
        => Ok(Result<IReadOnlyList<PackageTypeOption>>.Success(PackageTypeLabels.All));

    /// <summary>Hafif ürün listesi (dropdown'lar için: id + kod + ad). Yalnız aktif ürünler.</summary>
    [HttpGet("lookup")]
    [HasPermission(Permissions.Products.View)]
    public async Task<IActionResult> Lookup(CancellationToken ct)
    {
        var items = await _uow.Repository<Product>().Query()
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new ProductLookupDto { Id = p.Id, ProductCode = p.ProductCode, Name = p.Name })
            .ToListAsync(ct);

        return Ok(Result<IReadOnlyList<ProductLookupDto>>.Success(items));
    }

    [HttpGet]
    [HasPermission(Permissions.Products.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] Guid? customerId,
        CancellationToken ct)
    {
        IQueryable<Product> query = _uow.Repository<Product>().Query()
            .Include(p => p.Customer)
            .Include(p => p.ProductGroup);

        if (customerId is not null)
            query = query.Where(p => p.CustomerId == customerId);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(p =>
                p.ProductCode.Contains(s) ||
                p.Name.Contains(s) ||
                (p.Barcode != null && p.Barcode.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "productcode" => request.SortDescending ? query.OrderByDescending(p => p.ProductCode) : query.OrderBy(p => p.ProductCode),
            "customer" => request.SortDescending ? query.OrderByDescending(p => p.Customer!.Name) : query.OrderBy(p => p.Customer!.Name),
            "createdat" => request.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => request.SortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(p => new ProductListItemDto
        {
            Id = p.Id,
            ProductCode = p.ProductCode,
            Barcode = p.Barcode,
            Name = p.Name,
            CustomerId = p.CustomerId,
            CustomerName = p.Customer?.Name,
            PackageType = p.PackageType,
            PackageTypeLabel = PackageTypeLabels.Of(p.PackageType),
            NetWeight = p.NetWeight,
            ProductGroupName = p.ProductGroup?.Name,
            IsActive = p.IsActive,
            CreatedAt = p.CreatedAt,
        }).ToList();

        var paged = new PagedResult<ProductListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<ProductListItemDto>>.Success(paged));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Products.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var p = await LoadWithRefs().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Ürün", id);
        return Ok(Result<ProductDetailDto>.Success(ToDetail(p)));
    }

    [HttpPost]
    [HasPermission(Permissions.Products.Create)]
    public async Task<IActionResult> Create([FromBody] SaveProductRequest request, CancellationToken ct)
    {
        EnsurePackageTypeValid(request.PackageType);
        await ValidateReferencesAsync(request, ct);

        var code = request.ProductCode.Trim();
        var barcode = Normalize(request.Barcode);
        await EnsureUniqueAsync(code, barcode, null, ct);

        var entity = new Product
        {
            CustomerId = request.CustomerId,
            ProductCode = code,
            Barcode = barcode,
            Name = request.Name.Trim(),
            NetWeight = request.NetWeight,
            GrossWeight = request.GrossWeight,
            PackageType = request.PackageType,
            UnitsPerPackage = request.UnitsPerPackage,
            UnitsPerCase = request.UnitsPerCase,
            ProductGroupId = request.ProductGroupId,
            ReturnGroupId = request.ReturnGroupId,
            WasteGroupId = request.WasteGroupId,
            ProcessTypeId = request.ProcessTypeId,
            IsActive = request.IsActive,
        };

        await _uow.Repository<Product>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Ürün oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Products.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveProductRequest request, CancellationToken ct)
    {
        EnsurePackageTypeValid(request.PackageType);

        var repo = _uow.Repository<Product>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Ürün", id);

        await ValidateReferencesAsync(request, ct);

        var code = request.ProductCode.Trim();
        var barcode = Normalize(request.Barcode);
        await EnsureUniqueAsync(code, barcode, id, ct);

        entity.CustomerId = request.CustomerId;
        entity.ProductCode = code;
        entity.Barcode = barcode;
        entity.Name = request.Name.Trim();
        entity.NetWeight = request.NetWeight;
        entity.GrossWeight = request.GrossWeight;
        entity.PackageType = request.PackageType;
        entity.UnitsPerPackage = request.UnitsPerPackage;
        entity.UnitsPerCase = request.UnitsPerCase;
        entity.ProductGroupId = request.ProductGroupId;
        entity.ReturnGroupId = request.ReturnGroupId;
        entity.WasteGroupId = request.WasteGroupId;
        entity.ProcessTypeId = request.ProcessTypeId;
        entity.IsActive = request.IsActive;

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Ürün güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Products.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Product>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Ürün", id);

        // Not: İleride Mal Kabul/Stok modülleri Product'a FK ile bağlanınca
        // kullanımdaki ürün için silme koruması (BusinessRuleException) eklenecek.
        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Ürün silindi."));
    }

    private IQueryable<Product> LoadWithRefs() => _uow.Repository<Product>().Query()
        .Include(p => p.Customer)
        .Include(p => p.ProductGroup)
        .Include(p => p.ReturnGroup)
        .Include(p => p.WasteGroup)
        .Include(p => p.ProcessType);

    private static ProductDetailDto ToDetail(Product p) => new()
    {
        Id = p.Id,
        ProductCode = p.ProductCode,
        Barcode = p.Barcode,
        Name = p.Name,
        CustomerId = p.CustomerId,
        CustomerName = p.Customer?.Name,
        NetWeight = p.NetWeight,
        GrossWeight = p.GrossWeight,
        PackageType = p.PackageType,
        PackageTypeLabel = PackageTypeLabels.Of(p.PackageType),
        UnitsPerPackage = p.UnitsPerPackage,
        UnitsPerCase = p.UnitsPerCase,
        ProductGroupId = p.ProductGroupId,
        ProductGroupName = p.ProductGroup?.Name,
        ReturnGroupId = p.ReturnGroupId,
        ReturnGroupName = p.ReturnGroup?.Name,
        WasteGroupId = p.WasteGroupId,
        WasteGroupName = p.WasteGroup?.Name,
        ProcessTypeId = p.ProcessTypeId,
        ProcessTypeName = p.ProcessType?.Name,
        IsActive = p.IsActive,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };

    /// <summary>Müşteri ve dört Definition FK'sinin var olduğunu ve doğru türde olduğunu doğrular.</summary>
    private async Task ValidateReferencesAsync(SaveProductRequest request, CancellationToken ct)
    {
        if (request.CustomerId is Guid cId && !await _uow.Repository<Account>().ExistsAsync(cId, ct))
            throw new ValidationException("Seçilen müşteri bulunamadı.");

        await EnsureDefinitionAsync(request.ProductGroupId, DefinitionType.ProductGroup, "ürün grubu", ct);
        await EnsureDefinitionAsync(request.ReturnGroupId, DefinitionType.ReturnGroup, "iade grubu", ct);
        await EnsureDefinitionAsync(request.WasteGroupId, DefinitionType.WasteGroup, "atık grubu", ct);
        await EnsureDefinitionAsync(request.ProcessTypeId, DefinitionType.ProcessType, "işlem türü", ct);
    }

    private async Task EnsureDefinitionAsync(Guid? id, DefinitionType expectedType, string label, CancellationToken ct)
    {
        if (id is not Guid defId)
            return;

        var def = await _uow.Repository<Definition>().Query().FirstOrDefaultAsync(d => d.Id == defId, ct);
        if (def is null || def.Type != expectedType)
            throw new ValidationException($"Seçilen {label} geçersiz.");
    }

    private async Task EnsureUniqueAsync(string code, string? barcode, Guid? excludeId, CancellationToken ct)
    {
        var repo = _uow.Repository<Product>().Query();
        if (excludeId is { } id)
            repo = repo.Where(p => p.Id != id);

        if (await repo.AnyAsync(p => p.ProductCode == code, ct))
            throw new ConflictException($"'{code}' kodlu bir ürün zaten var.");

        if (barcode is not null && await repo.AnyAsync(p => p.Barcode == barcode, ct))
            throw new ConflictException($"'{barcode}' barkodu zaten kullanılıyor.");
    }

    private static void EnsurePackageTypeValid(PackageType type)
    {
        if (!Enum.IsDefined(type))
            throw new ValidationException("Geçersiz ambalaj türü.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
