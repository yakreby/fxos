namespace FxOs.Application.Common.Exceptions;

/// <summary>Girdi doğrulaması başarısız → HTTP 400. Alan hataları <see cref="Errors"/>'da.</summary>
public sealed class ValidationException : FxException
{
    private readonly List<string> _errors;

    public ValidationException(string error) : base("Doğrulama hatası.")
    {
        _errors = new List<string> { error };
    }

    public ValidationException(IEnumerable<string> errors) : base("Doğrulama hatası.")
    {
        _errors = errors.ToList();
    }

    public override int StatusCode => 400;
    public override IReadOnlyList<string> Errors => _errors;
}
