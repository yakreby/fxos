namespace FxOs.Shared.Pagination;

/// <summary>
/// Listeleme isteklerinde ortak sayfalama/sıralama/arama parametreleri.
/// Tüm tablolar (FxTable) bu sözleşmeyi kullanır:
/// sıralama, arama, sayfa ve sayfa başına kayıt (entity per page).
/// </summary>
public class PaginationRequest
{
    private const int MaxPageSize = 200;
    private int _pageSize = 25;
    private int _page = 1;

    /// <summary>1'den başlayan sayfa numarası.</summary>
    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    /// <summary>Sayfa başına kayıt sayısı (entity per page). Üst sınır <see cref="MaxPageSize"/>.</summary>
    public int PageSize
    {
        get => _pageSize;
        set => _pageSize = value switch
        {
            < 1 => 1,
            > MaxPageSize => MaxPageSize,
            _ => value
        };
    }

    /// <summary>Tablo içi serbest metin araması.</summary>
    public string? Search { get; set; }

    /// <summary>Sıralanacak alan adı (header key).</summary>
    public string? SortBy { get; set; }

    /// <summary>true ise azalan (descending) sıralama.</summary>
    public bool SortDescending { get; set; }

    /// <summary>EF sorgularında Skip değeri.</summary>
    public int Skip => (Page - 1) * PageSize;
}
