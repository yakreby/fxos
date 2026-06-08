using FxOs.Domain.GoodsReceipts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>GoodsReceiptLines tablosu eşlemesi (satır).</summary>
public sealed class GoodsReceiptLineConfiguration : IEntityTypeConfiguration<GoodsReceiptLine>
{
    public void Configure(EntityTypeBuilder<GoodsReceiptLine> builder)
    {
        builder.ToTable("GoodsReceiptLines");

        builder.Property(l => l.Quantity).HasColumnType("decimal(18,3)");
        builder.Property(l => l.Weight).HasColumnType("decimal(18,3)");
        builder.Property(l => l.Note).HasMaxLength(500);

        builder.HasIndex(l => l.GoodsReceiptId);

        builder.HasOne(l => l.Product).WithMany()
            .HasForeignKey(l => l.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(l => l.Shelf).WithMany()
            .HasForeignKey(l => l.ShelfId).OnDelete(DeleteBehavior.Restrict);
    }
}
