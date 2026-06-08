using System.Security.Claims;
using FxOs.Application.Common.Authorization;
using FxOs.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FxOs.Persistence.Seed;

/// <summary>
/// Temel rolleri ve ilk admin kullanıcıyı (idempotent) oluşturur.
/// Değerler <c>Seed</c> konfig bölümünden okunur; her açılışta güvenle çağrılabilir.
/// </summary>
public static class IdentityDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("IdentityDataSeeder");

        if (!configuration.GetValue("Seed:Enabled", true))
        {
            logger.LogInformation("Seed devre dışı (Seed:Enabled=false), atlanıyor.");
            return;
        }

        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        // 1) Temel roller
        foreach (var roleName in FxRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new ApplicationRole(roleName));
                LogIdentityResult(logger, result, $"'{roleName}' rolü oluşturuldu.", $"'{roleName}' rolü oluşturulamadı");
            }
        }

        // 1b) Admin rolü tüm izinlere sahip olsun (idempotent claim ekleme).
        var adminRole = await roleManager.FindByNameAsync(FxRoles.Admin);
        if (adminRole is not null)
        {
            var existingClaims = await roleManager.GetClaimsAsync(adminRole);
            foreach (var permission in Permissions.All)
            {
                var hasClaim = existingClaims.Any(c =>
                    c.Type == Permissions.ClaimType && c.Value == permission);
                if (!hasClaim)
                    await roleManager.AddClaimAsync(adminRole, new Claim(Permissions.ClaimType, permission));
            }
        }

        // 2) İlk admin kullanıcı
        var adminEmail = configuration.GetValue("Seed:AdminEmail", "admin@fxos.local")!;
        var adminPassword = configuration.GetValue("Seed:AdminPassword", "Admin!2345")!;
        var adminFullName = configuration.GetValue("Seed:AdminFullName", "FxOs Admin")!;

        var existing = await userManager.FindByEmailAsync(adminEmail);
        if (existing is null)
        {
            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true,
                FullName = adminFullName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var created = await userManager.CreateAsync(admin, adminPassword);
            if (created.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, FxRoles.Admin);
                logger.LogInformation("İlk admin kullanıcı oluşturuldu: {Email}", adminEmail);
            }
            else
            {
                LogIdentityResult(logger, created, string.Empty, "Admin kullanıcı oluşturulamadı");
            }
        }
        else
        {
            logger.LogInformation("Admin kullanıcı zaten mevcut: {Email}", adminEmail);
        }
    }

    private static void LogIdentityResult(
        ILogger logger, IdentityResult result, string successMessage, string failurePrefix)
    {
        if (result.Succeeded)
        {
            if (!string.IsNullOrEmpty(successMessage))
                logger.LogInformation("{Message}", successMessage);
        }
        else
        {
            var errors = string.Join("; ", result.Errors.Select(e => $"{e.Code}: {e.Description}"));
            logger.LogError("{Prefix}: {Errors}", failurePrefix, errors);
        }
    }
}
