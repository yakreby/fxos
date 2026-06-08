using FxOs.Domain.Common;

namespace FxOs.Domain.Notifications;

/// <summary>
/// Kalıcı kullanıcı bildirimi. Her kayıt bir alıcıya (<see cref="UserId"/>) aittir.
/// Sistem/diğer modüller olay oluştukça bu kayıtları üretir; kullanıcı panelden görür.
/// </summary>
public class Notification : BaseEntity
{
    /// <summary>Alıcı kullanıcının Id'si (ApplicationUser).</summary>
    public Guid UserId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public NotificationType Type { get; set; } = NotificationType.Info;

    /// <summary>Tıklanınca gidilecek uygulama içi yol/anahtar (opsiyonel).</summary>
    public string? Link { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
