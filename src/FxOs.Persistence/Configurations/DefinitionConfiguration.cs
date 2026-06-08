using FxOs.Domain.Definitions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>Definitions tablosu eşlemesi (tek tablolu, Type ile gruplanan lookup).</summary>
public sealed class DefinitionConfiguration : IEntityTypeConfiguration<Definition>
{
    public void Configure(EntityTypeBuilder<Definition> builder)
    {
        builder.ToTable("Definitions");

        builder.Property(d => d.Type).IsRequired();
        builder.Property(d => d.Code).HasMaxLength(50);
        builder.Property(d => d.Name).HasMaxLength(200).IsRequired();

        // Türe göre listeleme/benzersizlik kontrolleri tür+ad üzerinden yapılır.
        builder.HasIndex(d => new { d.Type, d.Name });
    }
}
