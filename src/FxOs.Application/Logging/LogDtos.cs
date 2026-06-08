namespace FxOs.Application.Logging;

/// <summary>Tek log kaydı (Serilog MSSQL sink "Logs" tablosundan okunur; salt-okunur).</summary>
public sealed class LogEntryDto
{
    public long Id { get; init; }
    public DateTime TimeStamp { get; init; }
    public string Level { get; init; } = string.Empty;
    public string? Message { get; init; }
    public string? Exception { get; init; }

    /// <summary>Serilog properties (XML/serbest metin); detay görünümünde gösterilir.</summary>
    public string? Properties { get; init; }
}

/// <summary>Log sorgu/filtre parametreleri (sayfalama + seviye + arama + tarih aralığı).</summary>
public sealed class LogQueryRequest
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 25;

    /// <summary>Tam seviye eşleşmesi (Warning/Error/Fatal). Null ise tümü.</summary>
    public string? Level { get; init; }

    /// <summary>Mesaj içinde geçen metin (LIKE).</summary>
    public string? Search { get; init; }

    /// <summary>Başlangıç (dahil) — TimeStamp >= From.</summary>
    public DateTime? From { get; init; }

    /// <summary>Bitiş (hariç) — TimeStamp &lt; To.</summary>
    public DateTime? To { get; init; }

    public int Skip => (Page < 1 ? 0 : Page - 1) * PageSize;
}

/// <summary>Sink'in (Warning+) ürettiği seviyeler; UI filtresi için.</summary>
public static class LogLevels
{
    public static readonly IReadOnlyList<string> All = new[] { "Warning", "Error", "Fatal" };
}
