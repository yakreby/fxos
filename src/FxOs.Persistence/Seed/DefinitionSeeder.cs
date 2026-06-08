using FxOs.Domain.Definitions;
using FxOs.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FxOs.Persistence.Seed;

/// <summary>
/// Başlangıç tanım (lookup) değerlerini idempotent olarak ekler. Eski sistemden devralınan
/// temel atık lokasyon/tip ve iade/atık/işlem grupları. Var olanlar (tür + ad) atlanır;
/// UI'dan eklenenler korunur. <c>Seed:Definitions</c> ile kapatılabilir (varsayılan açık).
/// </summary>
public static class DefinitionSeeder
{
    // Tür → sıralı ad listesi. Kod gerektiğinde "Ad|KOD" biçiminde verilebilir.
    private static readonly Dictionary<DefinitionType, string[]> Seed = new()
    {
        [DefinitionType.WasteLocation] = new[] { "İzmir Depo", "İzaydaş", "AGT Atık", "Fazla Gıda" },
        [DefinitionType.WasteType] = new[] { "OKTABİN", "PALET|150103", "GENEL-YEM HAMMADDE" },
        [DefinitionType.ReturnGroup] = new[]
        {
            "BİYOYAKIT-KATI", "BİYOYAKIT-SIVI", "YEM KATKI MADDESİ",
            "İMHA-CAM", "İMHA-PLASTİK", "İMHA-METAL",
        },
        [DefinitionType.WasteGroup] = new[] { "GERİ KAZANIM-KATI", "GERİ KAZANIM-SIVI", "YEM KATKI MADDESİ" },
        [DefinitionType.ProcessType] = new[] { "BİYOYAKIT", "YEM KATKI MADDESİ", "KAPSAM DIŞI", "ENDÜSTRİYEL" },
        [DefinitionType.ProductGroup] = Array.Empty<string>(),
    };

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("DefinitionSeeder");

        if (!configuration.GetValue("Seed:Enabled", true) || !configuration.GetValue("Seed:Definitions", true))
        {
            logger.LogInformation("Tanım seed devre dışı, atlanıyor.");
            return;
        }

        var context = services.GetRequiredService<FxOsDbContext>();
        var set = context.Set<Definition>();
        var added = 0;

        foreach (var (type, names) in Seed)
        {
            var existing = await set.Where(d => d.Type == type)
                .Select(d => d.Name)
                .ToListAsync(cancellationToken);
            var existingSet = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);

            var order = 0;
            foreach (var raw in names)
            {
                order++;
                var parts = raw.Split('|', 2);
                var name = parts[0].Trim();
                var code = parts.Length > 1 ? parts[1].Trim() : null;

                if (existingSet.Contains(name))
                    continue;

                await set.AddAsync(new Definition
                {
                    Type = type,
                    Name = name,
                    Code = code,
                    IsActive = true,
                    SortOrder = order,
                }, cancellationToken);
                added++;
            }
        }

        if (added > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("{Count} başlangıç tanımı eklendi.", added);
        }
    }
}
