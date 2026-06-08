using FxOs.Application.Common.Interfaces;
using FxOs.Domain.Common;
using FxOs.Persistence.Context;
using Microsoft.EntityFrameworkCore;

namespace FxOs.Persistence.Repositories;

/// <summary>
/// <see cref="IRepository{T}"/>'nin EF Core implementasyonu.
/// Yazma metotları sadece change-tracker'ı günceller; <c>SaveChanges</c> UoW'da çağrılır.
/// </summary>
public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly FxOsDbContext Context;
    protected readonly DbSet<T> Set;

    public Repository(FxOsDbContext context)
    {
        Context = context;
        Set = context.Set<T>();
    }

    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => Set.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public async Task<IReadOnlyList<T>> ListAllAsync(CancellationToken cancellationToken = default)
        => await Set.AsNoTracking().ToListAsync(cancellationToken);

    public Task<bool> ExistsAsync(Guid id, CancellationToken cancellationToken = default)
        => Set.AnyAsync(e => e.Id == id, cancellationToken);

    public IQueryable<T> Query() => Set.AsNoTracking();

    public async Task AddAsync(T entity, CancellationToken cancellationToken = default)
        => await Set.AddAsync(entity, cancellationToken);

    public void Update(T entity) => Set.Update(entity);

    public void Remove(T entity) => Set.Remove(entity);
}
