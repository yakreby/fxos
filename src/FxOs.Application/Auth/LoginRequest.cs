using System.ComponentModel.DataAnnotations;

namespace FxOs.Application.Auth;

/// <summary>Giriş isteği gövdesi.</summary>
public sealed class LoginRequest
{
    [Required(ErrorMessage = "E-posta zorunludur.")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta giriniz.")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre zorunludur.")]
    public string Password { get; set; } = string.Empty;

    /// <summary>Oturum kalıcı olsun mu (kapatınca da hatırlansın mı)?</summary>
    public bool RememberMe { get; set; } = true;
}
