using System.ComponentModel.DataAnnotations;

namespace FxOs.Application.Access;

/// <summary>Kullanıcı listesi satırı.</summary>
public sealed class UserListItemDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public bool IsActive { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
    public DateTime CreatedAt { get; init; }
}

/// <summary>Tek kullanıcı detayı (düzenleme ekranı).</summary>
public sealed class UserDetailDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public bool IsActive { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
}

public sealed class CreateUserRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8, ErrorMessage = "Şifre en az 8 karakter olmalıdır.")]
    public string Password { get; set; } = string.Empty;

    public string? FullName { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Atanacak rol adları.</summary>
    public List<string> Roles { get; set; } = new();
}

public sealed class UpdateUserRequest
{
    public string? FullName { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>Kullanıcının yeni rol kümesi (tam liste; fark uygulanır).</summary>
    public List<string> Roles { get; set; } = new();
}
