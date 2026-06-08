using System.Text.Json;
using FxOs.Shared.Results;

namespace FxOs.API.Common;

/// <summary>
/// HTTP yanıtına standart <see cref="Result"/> zarfını (camelCase JSON) yazan ortak yardımcı.
/// Exception middleware ve cookie auth event'leri tutarlı gövde için bunu kullanır.
/// </summary>
public static class ApiResponseWriter
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static Task WriteResultAsync(HttpContext context, int statusCode, Result result)
    {
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        return context.Response.WriteAsync(JsonSerializer.Serialize(result, JsonOptions));
    }
}
