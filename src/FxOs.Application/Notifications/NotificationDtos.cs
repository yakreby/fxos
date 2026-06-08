using System.ComponentModel.DataAnnotations;
using FxOs.Domain.Notifications;

namespace FxOs.Application.Notifications;

/// <summary>Bildirim satırı.</summary>
public sealed class NotificationDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public NotificationType Type { get; init; }
    public string? Link { get; init; }
    public bool IsRead { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>Bildirim gönderme isteği (yetkili kullanıcı → hedef kullanıcı).</summary>
public sealed class CreateNotificationRequest
{
    [Required]
    public Guid UserId { get; set; }

    [Required(ErrorMessage = "Başlık zorunludur."), MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mesaj zorunludur."), MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    public NotificationType Type { get; set; } = NotificationType.Info;

    [MaxLength(300)]
    public string? Link { get; set; }
}
