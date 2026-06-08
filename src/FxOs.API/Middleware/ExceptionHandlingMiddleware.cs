using FxOs.API.Common;
using FxOs.Application.Common.Exceptions;
using FxOs.Shared.Results;

namespace FxOs.API.Middleware;

/// <summary>
/// Yakalanmayan tüm istisnaları tek noktadan ele alır:
/// <list type="bullet">
///   <item><see cref="FxException"/> türevleri → kendi durum kodu + mesaj/alan hataları (4xx, beklenen).</item>
///   <item>Diğer her şey → 500 (beklenmeyen; üretimde mesaj gizlenir).</item>
/// </list>
/// Tüm yanıtlar <see cref="Result"/> zarfıyla döner. 4xx uyarı, 5xx hata olarak loglanır.
/// </summary>
public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _environment;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment environment)
    {
        _next = next;
        _logger = logger;
        _environment = environment;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (FxException ex)
        {
            // Beklenen iş istisnaları: 4xx, gövdede anlamlı mesaj.
            _logger.LogWarning(ex, "İş istisnası ({StatusCode}): {Path}", ex.StatusCode, context.Request.Path);
            var result = Result.Failure(ex.Message, ex.Errors.ToArray());
            await WriteAsync(context, ex.StatusCode, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İşlenmemiş istisna: {Path}", context.Request.Path);
            var result = _environment.IsDevelopment()
                ? Result.Failure("Sunucuda beklenmeyen bir hata oluştu.", ex.Message)
                : Result.Failure("Sunucuda beklenmeyen bir hata oluştu.");
            await WriteAsync(context, StatusCodes.Status500InternalServerError, result);
        }
    }

    private static Task WriteAsync(HttpContext context, int statusCode, Result result)
    {
        // Yanıt akmaya başladıysa müdahale edemeyiz; yeniden fırlat dışında seçenek yok.
        if (context.Response.HasStarted)
            return Task.CompletedTask;

        context.Response.Clear();
        return ApiResponseWriter.WriteResultAsync(context, statusCode, result);
    }
}
