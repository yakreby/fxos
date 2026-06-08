using FxOs.Domain.PreAccounting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Finansal işlem (Transactions) tablosu eşlemesi.</summary>
public sealed class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");

        builder.Property(t => t.Type).HasConversion<int>();
        builder.Property(t => t.Direction).HasConversion<int>();
        builder.Property(t => t.Method).HasConversion<int>();
        builder.Property(t => t.Amount).HasPrecision(18, 2);
        builder.Property(t => t.Description).HasMaxLength(500);
        builder.Property(t => t.Reference).HasMaxLength(100);

        builder.HasIndex(t => t.AccountId);
        builder.HasIndex(t => t.Date);
    }
}
