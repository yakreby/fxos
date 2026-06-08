using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Personnel;
using FxOs.Domain.Personnel;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;

namespace FxOs.API.Controllers;

/// <summary>Kadro/pozisyon lookup yönetimi (Personnel modülü referans verisi). <c>personnel.*</c> izinleriyle korunur.</summary>
[ApiController]
[Route("api/positions")]
[Authorize]
public sealed class PositionsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public PositionsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    [HasPermission(Permissions.Personnel.View)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var positions = await _uow.Repository<Position>().Query().OrderBy(p => p.Name).ToListAsync(ct);

        var counts = await _uow.Repository<PersonnelEntity>().Query()
            .Where(p => p.PositionId != null)
            .GroupBy(p => p.PositionId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);

        var items = positions.Select(p => new LookupDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            PersonnelCount = counts.GetValueOrDefault(p.Id),
        }).ToList();

        return Ok(Result<IReadOnlyList<LookupDto>>.Success(items));
    }

    [HttpPost]
    [HasPermission(Permissions.Personnel.Create)]
    public async Task<IActionResult> Create([FromBody] LookupRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (await _uow.Repository<Position>().Query().AnyAsync(p => p.Name == name, ct))
            throw new ConflictException($"'{name}' adında bir kadro zaten var.");

        var entity = new Position { Name = name, Description = Normalize(request.Description) };
        await _uow.Repository<Position>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Kadro oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Personnel.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] LookupRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<Position>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Kadro", id);

        var name = request.Name.Trim();
        if (await repo.Query().AnyAsync(p => p.Id != id && p.Name == name, ct))
            throw new ConflictException($"'{name}' adında bir kadro zaten var.");

        entity.Name = name;
        entity.Description = Normalize(request.Description);
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Kadro güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Personnel.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Position>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Kadro", id);

        if (await _uow.Repository<PersonnelEntity>().Query().AnyAsync(p => p.PositionId == id, ct))
            throw new BusinessRuleException("Bu kadroya bağlı personel var; önce personelin kadrosunu değiştirin.");

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Kadro silindi."));
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
