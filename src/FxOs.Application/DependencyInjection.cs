using Microsoft.Extensions.DependencyInjection;

namespace FxOs.Application;

/// <summary>
/// Application katmanının servis kayıtları. Composition Root'u (API) sade tutar.
/// İlerleyen fazlarda MediatR, FluentValidation, AutoMapper vb. burada kaydedilecek.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Şimdilik kayıt yok; use-case/handler altyapısı eklendikçe burası dolacak.
        return services;
    }
}
