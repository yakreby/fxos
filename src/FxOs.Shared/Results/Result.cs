namespace FxOs.Shared.Results;

/// <summary>
/// İşlem sonucunu temsil eden standart zarf (data taşımayan).
/// API katmanı tüm yanıtlarını bu yapı üzerinden döndürerek tutarlı bir
/// sözleşme sağlar (başarı/hata + mesaj + hata listesi).
/// </summary>
public class Result
{
    public bool Succeeded { get; protected set; }
    public string? Message { get; protected set; }
    public IReadOnlyList<string> Errors { get; protected set; } = Array.Empty<string>();

    protected Result(bool succeeded, string? message, IReadOnlyList<string>? errors)
    {
        Succeeded = succeeded;
        Message = message;
        Errors = errors ?? Array.Empty<string>();
    }

    public static Result Success(string? message = null)
        => new(true, message, null);

    public static Result Failure(string message, params string[] errors)
        => new(false, message, errors);

    public static Result Failure(IReadOnlyList<string> errors)
        => new(false, null, errors);
}

/// <summary>
/// Veri taşıyan sonuç zarfı. Başarı durumunda <typeparamref name="T"/> döner.
/// </summary>
public sealed class Result<T> : Result
{
    public T? Data { get; private set; }

    private Result(bool succeeded, T? data, string? message, IReadOnlyList<string>? errors)
        : base(succeeded, message, errors)
    {
        Data = data;
    }

    public static Result<T> Success(T data, string? message = null)
        => new(true, data, message, null);

    public static new Result<T> Failure(string message, params string[] errors)
        => new(false, default, message, errors);

    public static new Result<T> Failure(IReadOnlyList<string> errors)
        => new(false, default, null, errors);
}
