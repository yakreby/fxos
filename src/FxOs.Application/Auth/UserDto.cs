namespace FxOs.Application.Auth;

/// <summary>
/// İstemciye dönen kullanıcı özeti (oturum/me yanıtı). Hassas alanlar (hash vb.) taşınmaz.
/// </summary>
public sealed class UserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string? FullName { get; init; }
    public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();

    /// <summary>Kullanıcının (rollerinden gelen) etkin izinleri; UI görünürlüğü için.</summary>
    public IReadOnlyList<string> Permissions { get; init; } = Array.Empty<string>();
}
