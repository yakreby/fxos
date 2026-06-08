using FxOs.Domain.Octabins;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Octabins tablosu eşlemesi.</summary>
public sealed class OctabinConfiguration : IEntityTypeConfiguration<Octabin>
{
    public void Configure(EntityTypeBuilder<Octabin> builder)
    {
        builder.ToTable("Octabins");

        builder.Property(o => o.OctabinNumber).HasMaxLength(50).IsRequired();
        builder.Property(o => o.Content).HasMaxLength(500);
        builder.Property(o => o.Notes).HasMaxLength(2000);
        builder.Property(o => o.Capacity).HasColumnType("decimal(18,3)");
        builder.Property(o => o.NetWeight).HasColumnType("decimal(18,3)");

        builder.HasIndex(o => o.OctabinNumber);
        builder.HasIndex(o => o.Status);

        builder.HasOne(o => o.WasteType).WithMany()
            .HasForeignKey(o => o.WasteTypeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(o => o.Product).WithMany()
            .HasForeignKey(o => o.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(o => o.Shelf).WithMany()
            .HasForeignKey(o => o.ShelfId).OnDelete(DeleteBehavior.Restrict);
    }
}
