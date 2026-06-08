namespace FxOs.Application.Common.Export;

/// <summary>Dışa aktarma çıktı biçimi.</summary>
public enum ExportFormat
{
    /// <summary>CSV (UTF-8 BOM, ';' ayraç — Excel-TR uyumlu).</summary>
    Csv = 0,

    /// <summary>Excel çalışma kitabı (.xlsx).</summary>
    Excel = 1,

    /// <summary>PDF belgesi.</summary>
    Pdf = 2,
}

/// <summary>Sütun hizalaması (Excel/PDF için).</summary>
public enum ExportAlign
{
    Left = 0,
    Right = 1,
    Center = 2,
}

/// <summary>Dışa aktarılacak bir sütunun tanımı.</summary>
public sealed class ExportColumn
{
    public ExportColumn(string header, ExportAlign align = ExportAlign.Left)
    {
        Header = header;
        Align = align;
    }

    public string Header { get; }
    public ExportAlign Align { get; }
}

/// <summary>
/// Biçimden bağımsız tablo modeli. Controller'lar verisini buna doldurur;
/// <see cref="Interfaces.IExportService"/> bunu CSV/Excel/PDF'e çevirir.
/// </summary>
public sealed class ExportTable
{
    /// <summary>Başlık (dosya adı + Excel sayfa adı + PDF başlığı için).</summary>
    public required string Title { get; init; }

    /// <summary>Alt başlık (ör. tarih aralığı; opsiyonel).</summary>
    public string? Subtitle { get; init; }

    /// <summary>Sütun tanımları.</summary>
    public required IReadOnlyList<ExportColumn> Columns { get; init; }

    /// <summary>Satırlar — her satır sütun sayısı kadar hücre (null = boş).</summary>
    public required IReadOnlyList<IReadOnlyList<string?>> Rows { get; init; }
}

/// <summary>Üretilmiş dosya: içerik + MIME + uzantı.</summary>
public sealed record ExportFile(byte[] Content, string ContentType, string FileExtension);
