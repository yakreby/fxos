using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Personnel;
using FxOs.Domain.Personnel;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PersonnelEntity = FxOs.Domain.Personnel.Personnel;

namespace FxOs.API.Controllers;

/// <summary>
/// Personel kartı yönetimi — generic Repository + UnitOfWork kullanan ilk iş controller'ı.
/// İzin tabanlı korunur (<c>personnel.*</c>).
/// </summary>
[ApiController]
[Route("api/personnel")]
[Authorize]
public sealed class PersonnelController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public PersonnelController(IUnitOfWork uow) => _uow = uow;

    [HttpGet]
    [HasPermission(Permissions.Personnel.View)]
    public async Task<IActionResult> List(
        [FromQuery] PaginationRequest request,
        [FromQuery] PersonnelStatus? status,
        CancellationToken ct)
    {
        IQueryable<PersonnelEntity> query = _uow.Repository<PersonnelEntity>().Query()
            .Include(p => p.Department)
            .Include(p => p.Position);

        if (status is not null)
            query = query.Where(p => p.Status == status);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var s = request.Search.Trim();
            query = query.Where(p =>
                p.FirstName.Contains(s) || p.LastName.Contains(s) ||
                (p.Email != null && p.Email.Contains(s)) ||
                (p.Phone != null && p.Phone.Contains(s)));
        }

        query = request.SortBy?.ToLowerInvariant() switch
        {
            "firstname" => request.SortDescending ? query.OrderByDescending(p => p.FirstName) : query.OrderBy(p => p.FirstName),
            "fullname" => request.SortDescending
                ? query.OrderByDescending(p => p.LastName).ThenByDescending(p => p.FirstName)
                : query.OrderBy(p => p.LastName).ThenBy(p => p.FirstName),
            "department" => request.SortDescending ? query.OrderByDescending(p => p.Department!.Name) : query.OrderBy(p => p.Department!.Name),
            "position" => request.SortDescending ? query.OrderByDescending(p => p.Position!.Name) : query.OrderBy(p => p.Position!.Name),
            "status" => request.SortDescending ? query.OrderByDescending(p => p.Status) : query.OrderBy(p => p.Status),
            "createdat" => request.SortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt),
            _ => request.SortDescending ? query.OrderByDescending(p => p.LastName) : query.OrderBy(p => p.LastName),
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(request.Skip).Take(request.PageSize).ToListAsync(ct);

        var items = rows.Select(p => new PersonnelListItemDto
        {
            Id = p.Id,
            FirstName = p.FirstName,
            LastName = p.LastName,
            FullName = p.FullName,
            Email = p.Email,
            Phone = p.Phone,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.Name,
            PositionId = p.PositionId,
            PositionName = p.Position?.Name,
            Status = p.Status,
            StatusLabel = PersonnelStatusLabels.Of(p.Status),
            HireDate = p.HireDate,
            CreatedAt = p.CreatedAt,
        }).ToList();

        var paged = new PagedResult<PersonnelListItemDto>(items, total, request.Page, request.PageSize);
        return Ok(Result<PagedResult<PersonnelListItemDto>>.Success(paged));
    }

    /// <summary>Hafif personel listesi (dropdown'lar için; yalnız aktif).</summary>
    [HttpGet("lookup")]
    [HasPermission(Permissions.Personnel.View)]
    public async Task<IActionResult> Lookup(CancellationToken ct)
    {
        var rows = await _uow.Repository<PersonnelEntity>().Query()
            .Where(p => p.Status == PersonnelStatus.Active)
            .OrderBy(p => p.LastName).ThenBy(p => p.FirstName)
            .Select(p => new { p.Id, p.FirstName, p.LastName })
            .ToListAsync(ct);

        var items = rows
            .Select(p => new PersonnelLookupDto { Id = p.Id, FullName = $"{p.FirstName} {p.LastName}".Trim() })
            .ToList();

        return Ok(Result<IReadOnlyList<PersonnelLookupDto>>.Success(items));
    }

    [HttpGet("{id:guid}")]
    [HasPermission(Permissions.Personnel.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var p = await _uow.Repository<PersonnelEntity>().Query()
            .Include(x => x.Department)
            .Include(x => x.Position)
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Personel", id);
        return Ok(Result<PersonnelDetailDto>.Success(ToDetail(p)));
    }

    [HttpPost]
    [HasPermission(Permissions.Personnel.Create)]
    public async Task<IActionResult> Create([FromBody] CreatePersonnelRequest request, CancellationToken ct)
    {
        EnsureStatusValid(request.Status);
        await EnsureLookupsExistAsync(request.DepartmentId, request.PositionId, ct);

        var entity = new PersonnelEntity
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            NationalId = Normalize(request.NationalId),
            Email = Normalize(request.Email),
            Phone = Normalize(request.Phone),
            DepartmentId = request.DepartmentId,
            PositionId = request.PositionId,
            HireDate = request.HireDate,
            Status = request.Status,
            Notes = Normalize(request.Notes),
        };

        await _uow.Repository<PersonnelEntity>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Personel oluşturuldu."));
    }

    [HttpPut("{id:guid}")]
    [HasPermission(Permissions.Personnel.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePersonnelRequest request, CancellationToken ct)
    {
        EnsureStatusValid(request.Status);

        var repo = _uow.Repository<PersonnelEntity>();
        var entity = await repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Personel", id);

        await EnsureLookupsExistAsync(request.DepartmentId, request.PositionId, ct);

        entity.FirstName = request.FirstName.Trim();
        entity.LastName = request.LastName.Trim();
        entity.NationalId = Normalize(request.NationalId);
        entity.Email = Normalize(request.Email);
        entity.Phone = Normalize(request.Phone);
        entity.DepartmentId = request.DepartmentId;
        entity.PositionId = request.PositionId;
        entity.HireDate = request.HireDate;
        entity.Status = request.Status;
        entity.Notes = Normalize(request.Notes);

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Personel güncellendi."));
    }

    [HttpDelete("{id:guid}")]
    [HasPermission(Permissions.Personnel.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<PersonnelEntity>();
        var entity = await repo.GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Personel", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Personel silindi."));
    }

    private static PersonnelDetailDto ToDetail(PersonnelEntity p) => new()
    {
        Id = p.Id,
        FirstName = p.FirstName,
        LastName = p.LastName,
        FullName = p.FullName,
        NationalId = p.NationalId,
        Email = p.Email,
        Phone = p.Phone,
        DepartmentId = p.DepartmentId,
        DepartmentName = p.Department?.Name,
        PositionId = p.PositionId,
        PositionName = p.Position?.Name,
        HireDate = p.HireDate,
        Status = p.Status,
        StatusLabel = PersonnelStatusLabels.Of(p.Status),
        Notes = p.Notes,
        CreatedAt = p.CreatedAt,
        UpdatedAt = p.UpdatedAt,
    };

    private async Task EnsureLookupsExistAsync(Guid? departmentId, Guid? positionId, CancellationToken ct)
    {
        if (departmentId is Guid dId && !await _uow.Repository<Department>().ExistsAsync(dId, ct))
            throw new ValidationException("Seçilen departman bulunamadı.");
        if (positionId is Guid pId && !await _uow.Repository<Position>().ExistsAsync(pId, ct))
            throw new ValidationException("Seçilen kadro bulunamadı.");
    }

    private static void EnsureStatusValid(PersonnelStatus status)
    {
        if (!Enum.IsDefined(status))
            throw new ValidationException("Geçersiz personel durumu.");
    }

    /// <summary>Boş/whitespace string'leri null'a indirger (tutarlı veri için).</summary>
    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
