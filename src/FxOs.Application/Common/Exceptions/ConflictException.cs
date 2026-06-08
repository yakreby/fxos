namespace FxOs.Application.Common.Exceptions;

/// <summary>Kaynak çakışması (örn. benzersizlik ihlali, eşzamanlılık) → HTTP 409.</summary>
public sealed class ConflictException : FxException
{
    public ConflictException(string message) : base(message) { }

    public override int StatusCode => 409;
}
