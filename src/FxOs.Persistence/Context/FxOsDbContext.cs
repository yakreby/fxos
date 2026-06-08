using System.Linq.Expressions;
using FxOs.Application.Common.Interfaces;
using FxOs.Domain.Common;
using FxOs.Domain.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace FxOs.Persistence.Context;

/// <summary>
/// FxOs'un ana EF Core context'i. Identity tablolarını (Guid anahtarlı) barındırır,
/// ayrıca iki çapraz kesen davranışı merkezîleştirir:
/// <list type="bullet">
///   <item>Soft-delete: <see cref="BaseEntity"/> türevleri için global query filter (silinmiş kayıtlar gizlenir).</item>
///   <item>Audit: <see cref="SaveChangesAsync"/>'te CreatedAt/By, UpdatedAt/By, DeletedAt/By otomatik doldurulur.</item>
/// </list>
/// </summary>
public class FxOsDbContext
    : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>, IFxOsDbContext
{
    private readonly ICurrentUser _currentUser;

    public FxOsDbContext(DbContextOptions<FxOsDbContext> options, ICurrentUser currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Bu assembly'deki tüm IEntityTypeConfiguration<> uygulamalarını otomatik bağla.
        builder.ApplyConfigurationsFromAssembly(typeof(FxOsDbContext).Assembly);

        // BaseEntity türevi her entity'ye "IsDeleted == false" global query filter'ı uygula.
        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (!typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                continue;

            var parameter = Expression.Parameter(entityType.ClrType, "e");
            var propertyAccess = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
            var notDeleted = Expression.Not(propertyAccess);
            var lambda = Expression.Lambda(notDeleted, parameter);

            builder.Entity(entityType.ClrType).HasQueryFilter(lambda);
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInformation();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        ApplyAuditInformation();
        return base.SaveChanges();
    }

    /// <summary>
    /// Audit alanlarını doldurur ve fiziksel silmeyi soft-delete'e çevirir.
    /// </summary>
    private void ApplyAuditInformation()
    {
        var now = DateTime.UtcNow;
        var userId = _currentUser.UserId;

        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;

                case EntityState.Deleted:
                    // Fiziksel silme yok: soft-delete olarak işaretle.
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = now;
                    entry.Entity.DeletedBy = userId;
                    break;
            }
        }
    }
}
