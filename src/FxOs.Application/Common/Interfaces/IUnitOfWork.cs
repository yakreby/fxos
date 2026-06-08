using FxOs.Domain.Common;

namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// İş birimi (Unit of Work): aynı context üzerinden generic repository erişimi ve
/// tek bir transaction sınırında kalıcılık sağlar.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>İlgili entity için (önbelleğe alınmış) generic repository.</summary>
    IRepository<T> Repository<T>() where T : BaseEntity;

    /// <summary>Bekleyen tüm değişiklikleri kalıcılaştırır; etkilenen satır sayısını döner.</summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
