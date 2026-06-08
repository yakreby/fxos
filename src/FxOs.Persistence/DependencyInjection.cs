using FxOs.Application.Common.Interfaces;
using FxOs.Persistence.Context;
using FxOs.Persistence.Logging;
using FxOs.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FxOs.Persistence;

/// <summary>
/// Persistence katmanının servis kayıtları: DbContext, repository ve UnitOfWork.
/// Identity store/cookie yapılandırması API katmanında (cookie auth ile birlikte) yapılır.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<FxOsDbContext>(options =>
            options.UseSqlServer(connectionString, sql =>
                sql.MigrationsAssembly(typeof(FxOsDbContext).Assembly.FullName)));

        // Application'ın gördüğü soyut context, concrete olana yönlendirilir.
        services.AddScoped<IFxOsDbContext>(sp => sp.GetRequiredService<FxOsDbContext>());

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<ILogReader, LogReader>();

        return services;
    }
}
