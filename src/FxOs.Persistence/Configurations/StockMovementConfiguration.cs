using FxOs.Domain.Stock;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>StockMovements tablosu eşlemesi (stok ledger'ı).</summary>
public sealed class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("StockMovements");

        builder.Property(m => m.Quantity).HasColumnType("decimal(18,3)");
        builder.Property(m => m.Weight).HasColumnType("decimal(18,3)");
        builder.Property(m => m.Reference).HasMaxLength(100);
        builder.Property(m => m.Note).HasMaxLength(500);

        builder.HasIndex(m => m.ProductId);
        builder.HasIndex(m => m.ShelfId);
        builder.HasIndex(m => m.MovementDate);
        builder.HasIndex(m => m.GoodsReceiptId);

        builder.HasOne(m => m.Product).WithMany()
            .HasForeignKey(m => m.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(m => m.Shelf).WithMany()
            .HasForeignKey(m => m.ShelfId).OnDelete(DeleteBehavior.Restrict);
    }
}
