using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Facility;
using FxOs.Domain.Facility;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Dijital tesis haritası noktaları (genel merkez / toplama merkezi / tesis). Harita tüm
/// noktaları topluca çektiği için liste sayfalanmaz. <c>facility.*</c> izinleriyle korunur.
/// </summary>
[ApiController]
[Route("api/facility")]
[Authorize]
public sealed class FacilityController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public FacilityController(IUnitOfWork uow)
    {
        _uow = uow;
    }

    /// <summary>Tür + durum seçenekleri (form dropdown'ları).</summary>
    [HttpGet("meta")]
    [HasPermission(Permissions.Facility.View)]
    public IActionResult Meta()
        => Ok(Result<FacilityMetaDto>.Success(new FacilityMetaDto
        {
            Types = FacilityNodeTypeLabels.All,
            Statuses = FacilityNodeStatusLabels.All,
        }));

    /// <summary>Tüm harita noktaları (sıralı; sayfalanmaz — harita topluca tüketir).</summary>
    [HttpGet("nodes")]
    [HasPermission(Permissions.Facility.View)]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var rows = await _uow.Repository<FacilityNode>().Query()
            .OrderBy(n => n.SortOrder).ThenBy(n => n.Name)
            .ToListAsync(ct);

        var items = rows.Select(ToDto).ToList();
        return Ok(Result<IReadOnlyList<FacilityNodeDto>>.Success(items));
    }

    [HttpGet("nodes/{id:guid}")]
    [HasPermission(Permissions.Facility.View)]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var node = await _uow.Repository<FacilityNode>().GetByIdAsync(id, ct)
            ?? throw new NotFoundException("Harita noktası", id);

        return Ok(Result<FacilityNodeDto>.Success(ToDto(node)));
    }

    [HttpPost("nodes")]
    [HasPermission(Permissions.Facility.Create)]
    public async Task<IActionResult> Create([FromBody] SaveFacilityNodeRequest request, CancellationToken ct)
    {
        var entity = new FacilityNode
        {
            Name = request.Name.Trim(),
            City = request.City.Trim(),
            NodeType = request.NodeType,
            Status = request.Status,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Description = Normalize(request.Description),
            SortOrder = request.SortOrder,
        };

        await _uow.Repository<FacilityNode>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result<Guid>.Success(entity.Id, "Harita noktası oluşturuldu."));
    }

    [HttpPut("nodes/{id:guid}")]
    [HasPermission(Permissions.Facility.Update)]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveFacilityNodeRequest request, CancellationToken ct)
    {
        var repo = _uow.Repository<FacilityNode>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Harita noktası", id);

        entity.Name = request.Name.Trim();
        entity.City = request.City.Trim();
        entity.NodeType = request.NodeType;
        entity.Status = request.Status;
        entity.Latitude = request.Latitude;
        entity.Longitude = request.Longitude;
        entity.Description = Normalize(request.Description);
        entity.SortOrder = request.SortOrder;

        repo.Update(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Harita noktası güncellendi."));
    }

    [HttpDelete("nodes/{id:guid}")]
    [HasPermission(Permissions.Facility.Delete)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<FacilityNode>();
        var entity = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Harita noktası", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);

        return Ok(Result.Success("Harita noktası silindi."));
    }

    private static FacilityNodeDto ToDto(FacilityNode n) => new()
    {
        Id = n.Id,
        Name = n.Name,
        City = n.City,
        NodeType = n.NodeType,
        NodeTypeLabel = FacilityNodeTypeLabels.Of(n.NodeType),
        Status = n.Status,
        StatusLabel = FacilityNodeStatusLabels.Of(n.Status),
        Latitude = n.Latitude,
        Longitude = n.Longitude,
        Description = n.Description,
        SortOrder = n.SortOrder,
        CreatedAt = n.CreatedAt,
        UpdatedAt = n.UpdatedAt,
    };

    private static string? Normalize(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
