using System.ComponentModel.DataAnnotations;

namespace FxOs.Application.Access;

/// <summary>Rol listesi satırı.</summary>
public sealed class RoleListItemDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int PermissionCount { get; init; }
    /// <summary>Çekirdek (Admin/User) rol mü? UI'da silme/yeniden adlandırma kısıtlanır.</summary>
    public bool IsSystem { get; init; }
}

/// <summary>Rol detayı (izin matrisi ekranı).</summary>
public sealed class RoleDetailDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string? Description { get; init; }
    public bool IsSystem { get; init; }
    public IReadOnlyList<string> Permissions { get; init; } = Array.Empty<string>();
}

public sealed class CreateRoleRequest
{
    [Required, MinLength(2, ErrorMessage = "Rol adı en az 2 karakter olmalıdır.")]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>Atanacak izin anahtarları.</summary>
    public List<string> Permissions { get; set; } = new();
}

public sealed class UpdateRoleRequest
{
    public string? Description { get; set; }

    /// <summary>Rolün yeni izin kümesi (tam liste; fark uygulanır).</summary>
    public List<string> Permissions { get; set; } = new();
}
