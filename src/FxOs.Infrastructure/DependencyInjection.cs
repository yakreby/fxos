using FxOs.Application.Common.Interfaces;
using FxOs.Infrastructure.Export;
using FxOs.Infrastructure.Identity;
using Microsoft.Extensions.DependencyInjection;

namespace FxOs.Infrastructure;

/// <summary>
/// Infrastructure katmanının servis kayıtları: dış dünya ile konuşan teknik servisler
/// (HTTP bağlamı, ileride e-posta/SMS sağlayıcıları, dosya/saat servisleri vb.).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IExportService, ExportService>();

        return services;
    }
}
