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

/// <summary>Departman lookup yönetimi (Personnel modülü referans verisi). <c>personnel.*</c> izinleriyle korunur.</summary>
[ApiController]
[Route("api/departments")]
[Authorize]
public sealed class DepartmentsController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public DepartmentsController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    [HasPermission(Permissions.Personnel.View)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var departments = await _uow.Repository<Department>().Query().OrderBy(d => d.Name).ToListAsync(ct);

        var counts = await _uow.Repository<PersonnelEntity>().Query()
            .Where(p => p.DepartmentId != null)
            .GroupBy(p => p.DepartmentId!.Value)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Id, x => x.Count, ct);

        var items = departments.Select(d => new LookupDto
        {
            Id = d.Id,
            Name = d.Name,
            Description = d.Description,
            PersonnelCount = counts.GetValueOrDefault(d.Id),
        }).ToList();

        return Ok(Result<IReadOnlyList<LookupDto>>.Success(items));
    }

    [HttpPost]
    [HasPermission(Permissions.Personnel.Create)]
    public async Task<IActionResult> Create([FromBody] LookupRequest request, CancellationToken ct)
    {
        var name = request.Name.Trim();
        if (await _uow.Repository<Department>().Query().AnyAsync(d => d.Name == name, ct))
            throw new ConflictException($"'{name}' adında bir departman zaten var.");

        var entity = new Department { Name = name, Description = Normalize(request.Description) };
        await _uow.Repository<Department>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Departman oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Personnel.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] LookupRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<Department>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Departman", id);

        var name = request.Name.Trim();
        if (await repo.Query().AnyAsync(d => d.Id != id && d.Name == name, ct))
            throw new ConflictException($"'{name}' adında bir departman zaten var.");

        entity.Name = name;
        entity.Description = Normalize(request.Description);
        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Departman güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Personnel.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Department>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Departman", id);

        if (await _uow.Repository<PersonnelEntity>().Query().AnyAsync(p => p.DepartmentId == id, ct))
            throw new BusinessRuleException("Bu departmana bağlı personel var; önce personelin departmanını değiştirin.");

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Departman silindi."));
    }

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
