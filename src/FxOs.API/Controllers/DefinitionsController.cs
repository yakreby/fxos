using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Definitions;
using FxOs.Domain.Definitions;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Sistem geneli tanım (lookup) yönetimi — tek tablo, <see cref="DefinitionType"/> ile gruplanır.
/// Diğer modüller bu kayıtlara FK ile bağlanır. <c>definitions.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/definitions")]
[Authorize]
public sealed class DefinitionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DefinitionsController(IUnitOfWork uow) => _uow = uow;

    /// <summary>Tanım türleri (frontend sekmeleri için değer + etiket).</summary>
    [HttpGet("types")]
    [HasPermission(Permissions.Definitions.View)]
    public IActionResult Types()
        => Ok(Result<IReadOnlyList<DefinitionTypeOption>>.Success(DefinitionTypeLabels.All));

    /// <summary>Belirli bir türdeki tanımları sıra + ada göre listeler.</summary>
    [HttpGet]
    [HasPermission(Permissions.Definitions.View)]
    public async Task<IActionResult> List([FromQuery] DefinitionType type, CancellationToken ct)
    {
        var items = await _uow.Repository<Definition>().Query()
            .Where(d => d.Type == type)
            .OrderBy(d => d.SortOrder).ThenBy(d => d.Name)
            .Select(d => new DefinitionDto
            {
                Id = d.Id,
                Type = d.Type,
                TypeLabel = DefinitionTypeLabels.Of(d.Type),
                Code = d.Code,
                Name = d.Name,
                IsActive = d.IsActive,
                SortOrder = d.SortOrder,
                CreatedAt = d.CreatedAt,
            })
            .ToListAsync(ct);

        return Ok(Result<IReadOnlyList<DefinitionDto>>.Success(items));
    }

    [HttpPost]
    [HasPermission(Permissions.Definitions.Create)]
    public async Task<IActionResult> Create([FromBody] CreateDefinitionRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        var code = Normalize(request.Code);

        await EnsureUniqueAsync(request.Type, name, code, null, ct);

        var entity = new Definition
        {
            Type = request.Type,
            Code = code,
            Name = name,
            IsActive = request.IsActive,
            SortOrder = request.SortOrder,
        };
        await _uow.Repository<Definition>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Tanım oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Definitions.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDefinitionRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<Definition>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Tanım", id);

        var name = request.Name.Trim();
        var code = Normalize(request.Code);

        // Tür değişmez; benzersizlik aynı tür içinde kontrol edilir.
        await EnsureUniqueAsync(entity.Type, name, code, id, ct);

        entity.Code = code;
        entity.Name = name;
        entity.IsActive = request.IsActive;
        entity.SortOrder = request.SortOrder;
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Tanım güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Definitions.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Definition>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Tanım", id);

        // Not: İleride bu tanıma FK ile bağlı modüller (Ürün/Sayım vb.) geldiğinde
        // kullanımdaki kayıt için silme koruması (BusinessRuleException) eklenecek.
        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Tanım silindi."));
    }

    /// <summary>Aynı tür içinde ad ve (varsa) kod benzersizliğini doğrular.</summary>
    private async Task EnsureUniqueAsync(DefinitionType type, string name, string? code, Guid? excludeId, CancellationToken ct)
    {
        var query = _uow.Repository<Definition>().Query().Where(d => d.Type == type);
        if (excludeId is { } id)
            query = query.Where(d => d.Id != id);

        if (await query.AnyAsync(d => d.Name == name, ct))
            throw new ConflictException($"'{name}' adında bir tanım bu türde zaten var.");

        if (code is not null && await query.AnyAsync(d => d.Code == code, ct))
            throw new ConflictException($"'{code}' kodu bu türde zaten kullanılıyor.");
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
