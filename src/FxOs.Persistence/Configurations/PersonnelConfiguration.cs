using FxOs.Domain.Personnel;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Personnel tablosu eşlemesi: alan uzunlukları, hesaplanan alanın yok sayılması, lookup ilişkileri.</summary>
public sealed class PersonnelConfiguration : IEntityTypeConfiguration<Personnel>
{
    public void Configure(EntityTypeBuilder<Personnel> builder)
    {
        builder.ToTable("Personnel");

        builder.Property(p => p.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(p => p.LastName).HasMaxLength(100).IsRequired();
        builder.Property(p => p.NationalId).HasMaxLength(20);
        builder.Property(p => p.Email).HasMaxLength(256);
        builder.Property(p => p.Phone).HasMaxLength(32);
        builder.Property(p => p.Notes).HasMaxLength(2000);
        builder.Property(p => p.Status).HasConversion<int>();

        // Hesaplanan alan; sütun olarak eşlenmez.
        builder.Ignore(p => p.FullName);

        // Lookup'lar opsiyonel; departman/kadro silinse bile personel referansı korunur (Restrict).
        builder.HasOne(p => p.Department)
            .WithMany(d => d.Personnel)
            .HasForeignKey(p => p.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(p => p.Position)
            .WithMany(p => p.Personnel)
            .HasForeignKey(p => p.PositionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(p => new { p.LastName, p.FirstName });
    }
}
