namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// Application katmanının DbContext'e bağımlı kalmadan veri erişimi yapabilmesi için
/// soyutlanmış sözleşme. Concrete <c>FxOsDbContext</c> Persistence katmanındadır.
/// Şimdilik <see cref="SaveChangesAsync"/> yeterli; entity DbSet'leri ilgili modüller
/// eklendikçe buraya tanımlanacak.
/// </summary>
public interface IFxOsDbContext
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
