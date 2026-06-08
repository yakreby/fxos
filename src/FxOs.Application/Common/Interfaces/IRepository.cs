using FxOs.Domain.Common;

namespace FxOs.Application.Common.Interfaces;

/// <summary>
/// <see cref="BaseEntity"/> türevleri için generic veri erişim sözleşmesi.
/// Yazma işlemleri context'i izler; kalıcılık <see cref="IUnitOfWork.SaveChangesAsync"/>
/// çağrıldığında gerçekleşir (audit + soft-delete burada işler).
/// </summary>
public interface IRepository<T> where T : BaseEntity
{
    /// <summary>Id ile tek kayıt; bulunamazsa <c>null</c>. (Soft-delete filtresine tabi.)</summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Tüm (silinmemiş) kayıtlar.</summary>
    Task<IReadOnlyList<T>> ListAllAsync(CancellationToken cancellationToken = default);

    /// <summary>Verilen Id'de (silinmemiş) kayıt var mı?</summary>
    Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>Sorgu kompozisyonu için izlenmeyen (no-tracking) IQueryable.</summary>
    IQueryable<T> Query();

    Task AddAsync(T entity, CancellationToken cancellationToken = default);

    void Update(T entity);

    /// <summary>Soft-delete olarak işaretler (fiziksel silme yapılmaz).</summary>
    void Remove(T entity);
}
