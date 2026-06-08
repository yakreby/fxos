using FxOs.Application.Auth;
using FxOs.Application.Common.Authorization;
using FxOs.Domain.Identity;
using FxOs.Shared.Results;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FxOs.API.Controllers;

/// <summary>
/// Kimlik doğrulama uç noktaları: cookie tabanlı giriş/çıkış ve oturum bilgisi.
/// Tüm yanıtlar <see cref="Result"/> zarfıyla döner.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        SignInManager<ApplicationUser> signInManager,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _signInManager = signInManager;
        _logger = logger;
    }

    /// <summary>E-posta + şifre ile giriş; başarılıysa HttpOnly oturum cookie'si set edilir.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !user.IsActive)
        {
            // Kullanıcı yok / pasif: bilgi sızdırmamak için aynı genel mesaj.
            return Unauthorized(Result.Failure("E-posta veya şifre hatalı."));
        }

        var result = await _signInManager.PasswordSignInAsync(
            user, request.Password, isPersistent: request.RememberMe, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            _logger.LogInformation("Giriş başarılı: {Email}", user.Email);
            return Ok(Result<UserDto>.Success(await BuildUserDtoAsync(user), "Giriş başarılı."));
        }

        if (result.IsLockedOut)
            return Unauthorized(Result.Failure("Hesap geçici olarak kilitlendi. Lütfen sonra tekrar deneyin."));

        if (result.IsNotAllowed)
            return Unauthorized(Result.Failure("Bu hesapla giriş yapılamıyor."));

        return Unauthorized(Result.Failure("E-posta veya şifre hatalı."));
    }

    /// <summary>Oturumu kapatır (cookie temizlenir).</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        // SignInManager.SignOutAsync ek şemalar (External/TwoFactor) ister; biz yalnız
        // uygulama şemasını kullandığımız için doğrudan onu temizliyoruz.
        await HttpContext.SignOutAsync(IdentityConstants.ApplicationScheme);
        return Ok(Result.Success("Çıkış yapıldı."));
    }

    /// <summary>Aktif oturumun kullanıcı bilgisi; oturum yoksa 401.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
            return Unauthorized(Result.Failure("Oturum geçersiz."));

        return Ok(Result<UserDto>.Success(await BuildUserDtoAsync(user)));
    }

    private async Task<UserDto> BuildUserDtoAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        // Etkin izinler: kullanıcının rollerinin permission claim'lerinin birleşimi.
        var permissions = new HashSet<string>(StringComparer.Ordinal);
        foreach (var roleName in roles)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role is null) continue;
            foreach (var claim in await _roleManager.GetClaimsAsync(role))
                if (claim.Type == Permissions.ClaimType)
                    permissions.Add(claim.Value);
        }

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            FullName = user.FullName,
            Roles = roles.ToArray(),
            Permissions = permissions.ToArray(),
        };
    }
}
