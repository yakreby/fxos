namespace FxOs.Application.Common.Exceptions;

/// <summary>
/// Uygulama (iş) katmanı istisnalarının temeli. Her tür kendi HTTP karşılığını
/// (<see cref="StatusCode"/>) bilir; API'deki global middleware bunu okuyup
/// standart <c>Result</c> yanıtına çevirir. Application AspNetCore'a bağımlı
/// olmadığından kodlar düz tamsayı tutulur.
/// </summary>
public abstract class FxException : Exception
{
    protected FxException(string message) : base(message) { }

    /// <summary>İstemciye dönecek HTTP durum kodu.</summary>
    public abstract int StatusCode { get; }

    /// <summary>Mesaja ek detay/alan hataları (varsa).</summary>
    public virtual IReadOnlyList<string> Errors => Array.Empty<string>();
}
