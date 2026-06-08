using System.Text;
using ClosedXML.Excel;
using FxOs.Application.Common.Export;
using FxOs.Application.Common.Interfaces;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace FxOs.Infrastructure.Export;

/// <summary>
/// <see cref="IExportService"/> uygulaması. Biçimden bağımsız <see cref="ExportTable"/>'ı
/// CSV (yerleşik), Excel (ClosedXML) ve PDF (QuestPDF) çıktısına çevirir.
/// </summary>
public sealed class ExportService : IExportService
{
    private const string ExcelMime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    static ExportService()
    {
        // QuestPDF Community lisansı (ticari kullanımda ciro şartına dikkat).
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public ExportFile Generate(ExportTable table, ExportFormat format) => format switch
    {
        ExportFormat.Csv => new ExportFile(BuildCsv(table), "text/csv", "csv"),
        ExportFormat.Excel => new ExportFile(BuildExcel(table), ExcelMime, "xlsx"),
        ExportFormat.Pdf => new ExportFile(BuildPdf(table), "application/pdf", "pdf"),
        _ => throw new ArgumentOutOfRangeException(nameof(format)),
    };

    /* ---- CSV (UTF-8 BOM, ';' ayraç — Excel-TR uyumlu) ---- */

    private static byte[] BuildCsv(ExportTable table)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(';', table.Columns.Select(c => CsvCell(c.Header))));
        foreach (var row in table.Rows)
            sb.AppendLine(string.Join(';', Enumerable.Range(0, table.Columns.Count)
                .Select(i => CsvCell(i < row.Count ? row[i] : null))));

        // UTF-8 BOM: Excel'in Türkçe karakterleri doğru açması için.
        var preamble = Encoding.UTF8.GetPreamble();
        var body = Encoding.UTF8.GetBytes(sb.ToString());
        return preamble.Concat(body).ToArray();
    }

    private static string CsvCell(string? value)
    {
        var v = value ?? string.Empty;
        if (v.Contains(';') || v.Contains('"') || v.Contains('\n') || v.Contains('\r'))
            return $"\"{v.Replace("\"", "\"\"")}\"";
        return v;
    }

    /* ---- Excel (ClosedXML) ---- */

    private static byte[] BuildExcel(ExportTable table)
    {
        using var wb = new XLWorkbook();
        var ws = wb.Worksheets.Add(SafeSheetName(table.Title));

        var startRow = 1;
        if (!string.IsNullOrWhiteSpace(table.Subtitle))
        {
            ws.Cell(1, 1).Value = table.Subtitle;
            ws.Cell(1, 1).Style.Font.Italic = true;
            ws.Cell(1, 1).Style.Font.FontColor = XLColor.Gray;
            startRow = 2;
        }

        // Başlık satırı
        for (var c = 0; c < table.Columns.Count; c++)
        {
            var cell = ws.Cell(startRow, c + 1);
            cell.Value = table.Columns[c].Header;
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#EFEFEF");
        }

        // Veri satırları
        for (var r = 0; r < table.Rows.Count; r++)
        {
            var row = table.Rows[r];
            for (var c = 0; c < table.Columns.Count; c++)
            {
                var cell = ws.Cell(startRow + 1 + r, c + 1);
                cell.Value = c < row.Count ? row[c] ?? string.Empty : string.Empty;
                if (table.Columns[c].Align == ExportAlign.Right)
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;
                else if (table.Columns[c].Align == ExportAlign.Center)
                    cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }
        }

        ws.Columns().AdjustToContents();
        ws.SheetView.FreezeRows(startRow);

        using var ms = new MemoryStream();
        wb.SaveAs(ms);
        return ms.ToArray();
    }

    /// <summary>Excel sayfa adı: 31 karakter sınırı + yasak karakterleri temizler.</summary>
    private static string SafeSheetName(string title)
    {
        var cleaned = new string(title.Where(ch => !"[]:*?/\\".Contains(ch)).ToArray()).Trim();
        if (string.IsNullOrEmpty(cleaned)) cleaned = "Sayfa1";
        return cleaned.Length > 31 ? cleaned[..31] : cleaned;
    }

    /* ---- PDF (QuestPDF) ---- */

    private static byte[] BuildPdf(ExportTable table)
    {
        return Document.Create(doc =>
        {
            doc.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(24);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text(table.Title).FontSize(15).SemiBold();
                    if (!string.IsNullOrWhiteSpace(table.Subtitle))
                        col.Item().Text(table.Subtitle!).FontSize(9).FontColor(Colors.Grey.Darken1);
                });

                page.Content().PaddingVertical(8).Table(t =>
                {
                    t.ColumnsDefinition(cd =>
                    {
                        foreach (var _ in table.Columns) cd.RelativeColumn();
                    });

                    t.Header(h =>
                    {
                        foreach (var c in table.Columns)
                        {
                            var container = h.Cell().Background(Colors.Grey.Lighten3).Padding(4);
                            Aligned(container, c.Align).Text(c.Header).SemiBold();
                        }
                    });

                    foreach (var row in table.Rows)
                    {
                        for (var i = 0; i < table.Columns.Count; i++)
                        {
                            var val = i < row.Count ? row[i] : null;
                            var container = t.Cell().BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4);
                            Aligned(container, table.Columns[i].Align).Text(val ?? string.Empty);
                        }
                    }
                });

                page.Footer().AlignRight().Text(x =>
                {
                    x.CurrentPageNumber();
                    x.Span(" / ");
                    x.TotalPages();
                });
            });
        }).GeneratePdf();
    }

    private static IContainer Aligned(IContainer container, ExportAlign align) => align switch
    {
        ExportAlign.Right => container.AlignRight(),
        ExportAlign.Center => container.AlignCenter(),
        _ => container,
    };
}
