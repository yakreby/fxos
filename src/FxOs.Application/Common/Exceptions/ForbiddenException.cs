namespace FxOs.Application.Common.Exceptions;

/// <summary>Kimlik var ama bu işleme yetki yok → HTTP 403.</summary>
public sealed class ForbiddenException : FxException
{
    public ForbiddenException(string message = "Bu işlem için yetkiniz yok.") : base(message) { }

    public override int StatusCode => 403;
}
