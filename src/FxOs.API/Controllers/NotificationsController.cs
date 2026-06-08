using FxOs.API.Authorization;
using FxOs.Application.Common.Authorization;
using FxOs.Application.Common.Exceptions;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Notifications;
using FxOs.Domain.Identity;
using FxOs.Domain.Notifications;
using FxOs.Shared.Pagination;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FxOs.API.Controllers;

/// <summary>
/// Kullanıcı bildirimleri. Kendi bildirimlerini görmek/işaretlemek/silmek için yalnız
/// oturum yeterli; başkasına göndermek <c>notifications.send</c> izni gerektirir.
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationsController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly ICurrentUser _currentUser;
    private readonly UserManager<ApplicationUser> _userManager;

    public NotificationsController(IUnitOfWork uow, ICurrentUser currentUser, UserManager<ApplicationUser> userManager)
    {
        _uow = uow;
        _currentUser = currentUser;
        _userManager = userManager;
    }

    private Guid UserId => _currentUser.UserId ?? throw new ForbiddenException("Oturum bulunamadı.");

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] PaginationRequest paging, [FromQuery] bool? unreadOnly, CancellationToken ct)
    {
        var uid = UserId;
        var query = _uow.Repository<Notification>().Query().Where(n => n.UserId == uid);
        if (unreadOnly == true)
            query = query.Where(n => !n.IsRead);

        query = query.OrderByDescending(n => n.CreatedAt);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(paging.Skip).Take(paging.PageSize).ToListAsync(ct);

        var items = rows.Select(ToDto).ToList();
        var paged = new PagedResult<NotificationDto>(items, total, paging.Page, paging.PageSize);
        return Ok(Result<PagedResult<NotificationDto>>.Success(paged));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount(CancellationToken ct)
    {
        var uid = UserId;
        var count = await _uow.Repository<Notification>().Query()
            .CountAsync(n => n.UserId == uid && !n.IsRead, ct);
        return Ok(Result<int>.Success(count));
    }

    [HttpPut("{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Notification>();
        var entity = await repo.GetByIdAsync(id, ct);
        if (entity is null || entity.UserId != UserId)
            throw new NotFoundException("Bildirim", id);

        if (!entity.IsRead)
        {
            entity.IsRead = true;
            entity.ReadAt = DateTime.UtcNow;
            repo.Update(entity);
            await _uow.SaveChangesAsync(ct);
        }
        return Ok(Result.Success());
    }

    [HttpPut("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        var uid = UserId;
        var repo = _uow.Repository<Notification>();
        var unread = await repo.Query().Where(n => n.UserId == uid && !n.IsRead).ToListAsync(ct);
        if (unread.Count > 0)
        {
            var now = DateTime.UtcNow;
            foreach (var n in unread)
            {
                n.IsRead = true;
                n.ReadAt = now;
                repo.Update(n);
            }
            await _uow.SaveChangesAsync(ct);
        }
        return Ok(Result.Success($"{unread.Count} bildirim okundu işaretlendi."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var repo = _uow.Repository<Notification>();
        var entity = await repo.GetByIdAsync(id, ct);
        if (entity is null || entity.UserId != UserId)
            throw new NotFoundException("Bildirim", id);

        repo.Remove(entity);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result.Success("Bildirim silindi."));
    }

    [HttpPost]
    [HasPermission(Permissions.Notifications.Send)]
    public async Task<IActionResult> Create([FromBody] CreateNotificationRequest request, CancellationToken ct)
    {
        if (!Enum.IsDefined(request.Type))
            throw new ValidationException("Geçersiz bildirim türü.");

        var target = await _userManager.FindByIdAsync(request.UserId.ToString())
            ?? throw new NotFoundException("Kullanıcı", request.UserId);

        var entity = new Notification
        {
            UserId = target.Id,
            Title = request.Title.Trim(),
            Message = request.Message.Trim(),
            Type = request.Type,
            Link = string.IsNullOrWhiteSpace(request.Link) ? null : request.Link.Trim(),
        };

        await _uow.Repository<Notification>().AddAsync(entity, ct);
        await _uow.SaveChangesAsync(ct);
        return Ok(Result<Guid>.Success(entity.Id, "Bildirim gönderildi."));
    }

    private static NotificationDto ToDto(Notification n) => new()
    {
        Id = n.Id,
        Title = n.Title,
        Message = n.Message,
        Type = n.Type,
        Link = n.Link,
        IsRead = n.IsRead,
        CreatedAt = n.CreatedAt,
    };
}
