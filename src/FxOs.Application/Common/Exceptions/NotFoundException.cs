namespace FxOs.Application.Common.Exceptions;

/// <summary>İstenen kayıt bulunamadı → HTTP 404.</summary>
public sealed class NotFoundException : FxException
{
    public NotFoundException(string message) : base(message) { }

    /// <summary>"{entity} bulunamadı (anahtar: {key})." mesajını üretir.</summary>
    public NotFoundException(string entity, object key)
        : base($"{entity} bulunamadı (anahtar: {key}).") { }

    public override int StatusCode => 404;
}
