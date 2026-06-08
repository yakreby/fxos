using FxOs.Domain.GoodsReceipts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>GoodsReceipts tablosu eşlemesi (başlık).</summary>
public sealed class GoodsReceiptConfiguration : IEntityTypeConfiguration<GoodsReceipt>
{
    public void Configure(EntityTypeBuilder<GoodsReceipt> builder)
    {
        builder.ToTable("GoodsReceipts");

        builder.Property(g => g.ReceiptNumber).HasMaxLength(50).IsRequired();
        builder.Property(g => g.Notes).HasMaxLength(2000);

        builder.HasIndex(g => g.ReceiptNumber);

        builder.HasOne(g => g.Supplier).WithMany()
            .HasForeignKey(g => g.SupplierId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(g => g.Lines).WithOne(l => l.GoodsReceipt!)
            .HasForeignKey(l => l.GoodsReceiptId).OnDelete(DeleteBehavior.Cascade);
    }
}
