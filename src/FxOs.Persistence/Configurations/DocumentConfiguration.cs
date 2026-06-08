using FxOs.Domain.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Documents tablosu eşlemesi: alan uzunlukları, enum dönüşümü, personel ilişkisi, indexler.</summary>
public sealed class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> builder)
    {
        builder.ToTable("Documents");

        builder.Property(d => d.Title).HasMaxLength(200).IsRequired();
        builder.Property(d => d.Type).HasConversion<int>();
        builder.Property(d => d.Notes).HasMaxLength(2000);

        builder.Property(d => d.StorageKey).HasMaxLength(512).IsRequired();
        builder.Property(d => d.StorageProvider).HasMaxLength(20).IsRequired();
        builder.Property(d => d.FileName).HasMaxLength(260).IsRequired();
        builder.Property(d => d.ContentType).HasMaxLength(150).IsRequired();

        builder.HasOne(d => d.Personnel)
            .WithMany()
            .HasForeignKey(d => d.PersonnelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(d => d.PersonnelId);
        builder.HasIndex(d => d.ExpiryDate);
    }
}
