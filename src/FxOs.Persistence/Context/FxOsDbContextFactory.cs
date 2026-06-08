using FxOs.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace FxOs.Persistence.Context;

/// <summary>
/// Design-time (migration) için <see cref="FxOsDbContext"/> üretir.
/// Tüm web host'u (ve Serilog MSSQL sink'ini) ayağa kaldırmadan, yalnızca
/// connection string ile context kurar. <c>dotnet ef</c> komutları bu fabrikayı kullanır.
/// </summary>
public sealed class FxOsDbContextFactory : IDesignTimeDbContextFactory<FxOsDbContext>
{
    public FxOsDbContext CreateDbContext(string[] args)
    {
        var basePath = Directory.GetCurrentDirectory();

        var configuration = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "Design-time için 'DefaultConnection' bulunamadı. " +
                "Komutu API projesinin klasöründen çalıştırın veya ortam değişkeni tanımlayın.");
        }

        var options = new DbContextOptionsBuilder<FxOsDbContext>()
            .UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(FxOsDbContext).Assembly.FullName))
            .Options;

        return new FxOsDbContext(options, new DesignTimeCurrentUser());
    }

    /// <summary>Migration sırasında audit için kullanıcı yok; her alan null döner.</summary>
    private sealed class DesignTimeCurrentUser : ICurrentUser
    {
        public Guid? UserId => null;
        public string? UserName => null;
        public bool IsAuthenticated => false;
    }
}
