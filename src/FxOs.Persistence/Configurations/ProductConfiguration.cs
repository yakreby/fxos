using FxOs.Domain.Products;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Products tablosu eşlemesi (müşteri + dört Definition FK'si).</summary>
public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.Property(p => p.ProductCode).HasMaxLength(50).IsRequired();
        builder.Property(p => p.Barcode).HasMaxLength(50);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.NetWeight).HasColumnType("decimal(18,3)");
        builder.Property(p => p.GrossWeight).HasColumnType("decimal(18,3)");

        builder.HasIndex(p => p.ProductCode);
        builder.HasIndex(p => p.Barcode);

        builder.HasOne(p => p.Customer).WithMany()
            .HasForeignKey(p => p.CustomerId).OnDelete(DeleteBehavior.Restrict);

        // Dört adet Definition FK'si — aynı tabloya, ters navigasyon yok, silmede kısıtla.
        builder.HasOne(p => p.ProductGroup).WithMany()
            .HasForeignKey(p => p.ProductGroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.ReturnGroup).WithMany()
            .HasForeignKey(p => p.ReturnGroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.WasteGroup).WithMany()
            .HasForeignKey(p => p.WasteGroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(p => p.ProcessType).WithMany()
            .HasForeignKey(p => p.ProcessTypeId).OnDelete(DeleteBehavior.Restrict);
    }
}
