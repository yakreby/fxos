using FxOs.Application.Common.Export;

namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// Biçimden bağımsız tablo modelini (<see cref="ExportTable"/>) seçilen biçimde
/// (CSV/Excel/PDF) bir dosyaya çevirir. Tüm modüller dışa aktarma için bunu kullanır.
/// </summary>
public interface IExportService
{
    /// <summary>Tabloyu verilen biçimde üretir.</summary>
    ExportFile Generate(ExportTable table, ExportFormat format);
}
