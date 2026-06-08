using System.Globalization;
using FxOs.Application.Common.Export;

namespace FxOs.API.Common;

/// <summary>Dışa aktarma uçları için ortak yardımcılar (format çözümü, dosya adı, tarih etiketi).</summary>
public static class ExportHelpers
{
    private static readonly CultureInfo Tr = new("tr-TR");

    /// <summary>Sorgu string'inden biçimi çözer; tanınmazsa Excel.</summary>
    public static ExportFormat ParseFormat(string? format) => format?.Trim().ToLowerInvariant() switch
    {
        "csv" => ExportFormat.Csv,
        "pdf" => ExportFormat.Pdf,
        "excel" or "xlsx" or "xls" => ExportFormat.Excel,
        _ => ExportFormat.Excel,
    };

    /// <summary>İndirilecek dosya adı: "<slug>-yyyyMMdd-HHmm.<ext>".</summary>
    public static string FileName(string slug, string extension)
        => $"{slug}-{DateTime.Now:yyyyMMdd-HHmm}.{extension}";

    /// <summary>Tarih aralığını Türkçe alt başlık metnine çevirir (boşsa "Tüm kayıtlar").</summary>
    public static string DateRangeLabel(DateTime? from, DateTime? to)
    {
        if (from is null && to is null) return "Tüm kayıtlar";
        var f = from?.ToString("dd.MM.yyyy", Tr) ?? "…";
        var t = to?.ToString("dd.MM.yyyy", Tr) ?? "…";
        return $"Tarih aralığı: {f} – {t}";
    }

    /// <summary>Üst sınırı gün sonuna (23:59:59) genişletir — "to" dahil olsun.</summary>
    public static DateTime? EndOfDay(DateTime? to)
        => to?.Date.AddDays(1).AddTicks(-1);

    /* ---- Hücre biçimlendirme (tr-TR; null → boş) ---- */

    public static string Num(decimal? n) => n?.ToString("#,##0.###", Tr) ?? string.Empty;
    public static string Int(int? n) => n?.ToString("N0", Tr) ?? string.Empty;
    public static string Date(DateTime? d) => d?.ToString("dd.MM.yyyy", Tr) ?? string.Empty;
}
