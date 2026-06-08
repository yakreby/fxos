using System.Security.Claims;
using FxOs.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace FxOs.Infrastructure.Identity;

/// <summary>
/// <see cref="ICurrentUser"/>'ın HTTP bağlamına dayalı implementasyonu.
/// Aktif isteğin <c>ClaimsPrincipal</c>'ından kullanıcı Id ve adını okur.
/// </summary>
public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? Principal => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var value = Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? UserName => Principal?.FindFirstValue(ClaimTypes.Name);

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
}
