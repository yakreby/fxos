namespace FxOs.Application.Common.Exceptions;

/// <summary>
/// İş kuralı ihlali (girdi geçerli ama işlem mevcut duruma göre yapılamaz) → HTTP 422.
/// Örn. "Kapalı sevkiyat düzenlenemez."
/// </summary>
public sealed class BusinessRuleException : FxException
{
    public BusinessRuleException(string message) : base(message) { }

    public override int StatusCode => 422;
}
