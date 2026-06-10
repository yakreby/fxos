using FxOs.Domain.Facility;
using FxOs.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FxOs.Persistence.Seed;

/// <summary>
/// Dijital tesis haritası başlangıç noktalarını idempotent olarak ekler: İstanbul genel
/// merkez + Tophisar/Bursa ve batı/iç Anadolu toplama merkezleri. Var olan (ada göre)
/// noktalar atlanır; UI'dan eklenenler korunur. <c>Seed:Facility</c> ile kapatılabilir.
/// </summary>
public static class FacilityNodeSeeder
{
    private record SeedNode(string Name, string City, FacilityNodeType Type, FacilityNodeStatus Status, double Lat, double Lng, int Order);

    private static readonly SeedNode[] Seed =
    {
        new("Formex Genel Merkez", "İstanbul", FacilityNodeType.Headquarters, FacilityNodeStatus.Active, 41.0082, 28.9784, 0),
        new("Tophisar Toplama Merkezi", "Bursa", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 40.4300, 29.1600, 1),
        new("Kocaeli Toplama Merkezi", "Kocaeli", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 40.7654, 29.9408, 2),
        new("Sakarya Toplama Merkezi", "Sakarya", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 40.7889, 30.4053, 3),
        new("İzmir Toplama Merkezi", "İzmir", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 38.4237, 27.1428, 4),
        new("Balıkesir Toplama Merkezi", "Balıkesir", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 39.6484, 27.8826, 5),
        new("Eskişehir Toplama Merkezi", "Eskişehir", FacilityNodeType.CollectionCenter, FacilityNodeStatus.Active, 39.7767, 30.5206, 6),
        // Bölgesel dağıtım merkezleri
        new("Ankara Dağıtım Merkezi", "Ankara", FacilityNodeType.DistributionCenter, FacilityNodeStatus.Active, 39.9334, 32.8597, 10),
        new("Antalya Dağıtım Merkezi", "Antalya", FacilityNodeType.DistributionCenter, FacilityNodeStatus.Active, 36.8969, 30.7133, 11),
        new("Konya Dağıtım Merkezi", "Konya", FacilityNodeType.DistributionCenter, FacilityNodeStatus.Active, 37.8746, 32.4932, 12),
        new("Denizli Dağıtım Merkezi", "Denizli", FacilityNodeType.DistributionCenter, FacilityNodeStatus.Active, 37.7765, 29.0864, 13),
        new("Trabzon Dağıtım Merkezi", "Trabzon", FacilityNodeType.DistributionCenter, FacilityNodeStatus.Active, 41.0027, 39.7168, 14),
    };

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        var configuration = services.GetRequiredService<IConfiguration>();
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger("FacilityNodeSeeder");

        if (!configuration.GetValue("Seed:Enabled", true) || !configuration.GetValue("Seed:Facility", true))
        {
            logger.LogInformation("Tesis haritası seed devre dışı, atlanıyor.");
            return;
        }

        var context = services.GetRequiredService<FxOsDbContext>();
        var set = context.Set<FacilityNode>();

        var existing = await set.Select(n => n.Name).ToListAsync(cancellationToken);
        var existingSet = new HashSet<string>(existing, StringComparer.OrdinalIgnoreCase);

        var added = 0;
        foreach (var n in Seed)
        {
            if (existingSet.Contains(n.Name))
                continue;

            await set.AddAsync(new FacilityNode
            {
                Name = n.Name,
                City = n.City,
                NodeType = n.Type,
                Status = n.Status,
                Latitude = n.Lat,
                Longitude = n.Lng,
                SortOrder = n.Order,
            }, cancellationToken);
            added++;
        }

        if (added > 0)
        {
            await context.SaveChangesAsync(cancellationToken);
            logger.LogInformation("{Count} başlangıç tesis noktası eklendi.", added);
        }
    }
}
