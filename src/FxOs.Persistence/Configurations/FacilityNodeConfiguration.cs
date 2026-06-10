using FxOs.Domain.Facility;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>FacilityNodes tablosu eşlemesi.</summary>
public sealed class FacilityNodeConfiguration : IEntityTypeConfiguration<FacilityNode>
{
    public void Configure(EntityTypeBuilder<FacilityNode> builder)
    {
        builder.ToTable("FacilityNodes");

        builder.Property(n => n.Name).HasMaxLength(150).IsRequired();
        builder.Property(n => n.City).HasMaxLength(100).IsRequired();
        builder.Property(n => n.Description).HasMaxLength(500);

        builder.HasIndex(n => n.NodeType);
        builder.HasIndex(n => n.Status);
    }
}
