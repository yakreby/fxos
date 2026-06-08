using FxOs.Domain.PreAccounting;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Cari hesap (Accounts) tablosu eşlemesi.</summary>
public sealed class AccountConfiguration : IEntityTypeConfiguration<Account>
{
    public void Configure(EntityTypeBuilder<Account> builder)
    {
        builder.ToTable("Accounts");

        builder.Property(a => a.Name).HasMaxLength(200).IsRequired();
        builder.Property(a => a.TaxNumber).HasMaxLength(20);
        builder.Property(a => a.Phone).HasMaxLength(32);
        builder.Property(a => a.Email).HasMaxLength(256);
        builder.Property(a => a.Address).HasMaxLength(500);
        builder.Property(a => a.Notes).HasMaxLength(1000);
        builder.Property(a => a.Type).HasConversion<int>();
        builder.Property(a => a.OpeningBalance).HasPrecision(18, 2);

        builder.HasIndex(a => a.Name);

        builder.HasMany(a => a.Transactions)
            .WithOne(t => t.Account!)
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
