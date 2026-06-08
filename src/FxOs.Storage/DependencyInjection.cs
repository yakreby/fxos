using FxOs.Storage.Local;
using FxOs.Storage.R2;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FxOs.Storage;

/// <summary>
/// Depolama katmanının servis kayıtları. <c>Storage:Provider</c> değerine göre
/// aktif <see cref="IFileStorage"/> uygulamasını seçer ("local" varsayılan, "r2").
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddStorage(this IServiceCollection services, IConfiguration configuration)
    {
        var section = configuration.GetSection(StorageOptions.SectionName);
        services.Configure<StorageOptions>(section);

        var provider = section.GetValue<string>("Provider") ?? "local";
        if (string.Equals(provider, "r2", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IFileStorage, R2FileStorage>();
        else
            services.AddSingleton<IFileStorage, LocalFileStorage>();

        return services;
    }
}
