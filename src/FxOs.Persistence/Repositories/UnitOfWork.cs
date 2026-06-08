using System.Collections.Concurrent;
using FxOs.Application.Common.Interfaces;
using FxOs.Domain.Common;
using FxOs.Persistence.Context;

namespace FxOs.Persistence.Repositories;

/// <summary>
/// <see cref="IUnitOfWork"/> implementasyonu. Tek <see cref="FxOsDbContext"/> örneği
/// üzerinden çalışır; generic repository'leri tip bazında önbelleğe alır.
/// </summary>
public sealed class UnitOfWork : IUnitOfWork
{
    private readonly FxOsDbContext _context;
    private readonly ConcurrentDictionary<Type, object> _repositories = new();

    public UnitOfWork(FxOsDbContext context)
    {
        _context = context;
    }

    public IRepository<T> Repository<T>() where T : BaseEntity
        => (IRepository<T>)_repositories.GetOrAdd(typeof(T), _ => new Repository<T>(_context));

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => _context.SaveChangesAsync(cancellationToken);
}
