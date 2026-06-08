using FxOs.Application.Logging;
using FxOs.Shared.Pagination;

namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// Serilog "Logs" tablosundan salt-okunur log sorgulama sözleşmesi. Bu tablo EF
/// modeline dahil değildir (sink yönetir); implementasyon ham SQL ile okur.
/// </summary>
public interface ILogReader
{
    Task<PagedResult<LogEntryDto>> QueryAsync(LogQueryRequest request, CancellationToken cancellationToken = default);
}
