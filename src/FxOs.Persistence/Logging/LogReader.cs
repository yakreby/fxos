using System.Data;
using System.Data.Common;
using FxOs.Application.Common.Interfaces;
using FxOs.Application.Logging;
using FxOs.Persistence.Context;
using FxOs.Shared.Pagination;
using Microsoft.EntityFrameworkCore;

namespace FxOs.Persistence.Logging;

/// <summary>
/// <see cref="ILogReader"/>'ın ham SQL implementasyonu. Serilog'un yönettiği "Logs"
/// tablosunu EF modeline sokmadan, context'in paylaşılan bağlantısı üzerinden okur.
/// </summary>
public sealed class LogReader : ILogReader
{
    private const int MaxPageSize = 200;

    private readonly FxOsDbContext _context;

    public LogReader(FxOsDbContext context) => _context = context;

    public async Task<PagedResult<LogEntryDto>> QueryAsync(LogQueryRequest request, CancellationToken cancellationToken = default)
    {
        var pageSize = Math.Clamp(request.PageSize, 1, MaxPageSize);
        var page = request.Page < 1 ? 1 : request.Page;
        var skip = (page - 1) * pageSize;

        const string sql = @"
SELECT [Id],[TimeStamp],[Level],[Message],[Exception],[Properties], COUNT(*) OVER() AS TotalCount
FROM [dbo].[Logs]
WHERE (@level  IS NULL OR [Level] = @level)
  AND (@search IS NULL OR [Message] LIKE @search)
  AND (@from   IS NULL OR [TimeStamp] >= @from)
  AND (@to     IS NULL OR [TimeStamp] <  @to)
ORDER BY [Id] DESC
OFFSET @skip ROWS FETCH NEXT @take ROWS ONLY;";

        var connection = _context.Database.GetDbConnection();
        var shouldClose = connection.State != ConnectionState.Open;
        if (shouldClose) await connection.OpenAsync(cancellationToken);

        try
        {
            await using var cmd = connection.CreateCommand();
            cmd.CommandText = sql;
            AddParam(cmd, "@level", (object?)request.Level ?? DBNull.Value);
            AddParam(cmd, "@search", string.IsNullOrWhiteSpace(request.Search) ? DBNull.Value : $"%{request.Search.Trim()}%");
            AddParam(cmd, "@from", (object?)request.From ?? DBNull.Value);
            AddParam(cmd, "@to", (object?)request.To ?? DBNull.Value);
            AddParam(cmd, "@skip", skip);
            AddParam(cmd, "@take", pageSize);

            var items = new List<LogEntryDto>(pageSize);
            var total = 0;

            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                total = Convert.ToInt32(reader["TotalCount"]);
                var ts = reader["TimeStamp"];
                items.Add(new LogEntryDto
                {
                    Id = Convert.ToInt64(reader["Id"]),
                    TimeStamp = ts is DateTimeOffset dto ? dto.UtcDateTime : Convert.ToDateTime(ts),
                    Level = reader["Level"] as string ?? string.Empty,
                    Message = reader["Message"] as string,
                    Exception = reader["Exception"] as string,
                    Properties = reader["Properties"] as string,
                });
            }

            return new PagedResult<LogEntryDto>(items, total, page, pageSize);
        }
        catch (DbException ex) when (ex.Message.Contains("Invalid object name", StringComparison.OrdinalIgnoreCase))
        {
            // "Logs" tablosu henüz oluşmadı (hiç Warning+ log yazılmadı) → boş sonuç.
            return new PagedResult<LogEntryDto>(Array.Empty<LogEntryDto>(), 0, page, pageSize);
        }
        finally
        {
            if (shouldClose) await connection.CloseAsync();
        }
    }

    private static void AddParam(DbCommand cmd, string name, object value)
    {
        var p = cmd.CreateParameter();
        p.ParameterName = name;
        p.Value = value;
        cmd.Parameters.Add(p);
    }
}
