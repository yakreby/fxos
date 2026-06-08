namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// İçinde bulunulan isteğin (request) kimliği doğrulanmış kullanıcısına erişim.
/// Audit alanlarının (CreatedBy/UpdatedBy/DeletedBy) otomatik doldurulmasında
/// ve yetki kontrollerinde kullanılır. Implementasyonu Infrastructure katmanında
/// (<c>IHttpContextAccessor</c> üzerinden) yer alır.
/// </summary>
public interface ICurrentUser
{
    /// <summary>Oturum açmış kullanıcının Id'si; anonim istekte <c>null</c>.</summary>
    Guid? UserId { get; }

    /// <summary>Kullanıcının görünen adı/kullanıcı adı; yoksa <c>null</c>.</summary>
    string? UserName { get; }

    /// <summary>İsteğin kimliği doğrulanmış mı?</summary>
    bool IsAuthenticated { get; }
}
