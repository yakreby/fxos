using FxOs.Domain.Separations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FxOs.Persistence.Configurations;

/// <summary>SeparationRequests tablosu eşlemesi.</summary>
public sealed class SeparationRequestConfiguration : IEntityTypeConfiguration<SeparationRequest>
{
    public void Configure(EntityTypeBuilder<SeparationRequest> builder)
    {
        builder.ToTable("SeparationRequests");

        builder.Property(s => s.RequestNumber).HasMaxLength(50).IsRequired();
        builder.Property(s => s.Content).HasMaxLength(500);
        builder.Property(s => s.Notes).HasMaxLength(2000);
        builder.Property(s => s.Weight).HasColumnType("decimal(18,3)");

        builder.HasIndex(s => s.RequestNumber);
        builder.HasIndex(s => s.Status);

        builder.HasOne(s => s.AssignedPersonnel).WithMany()
            .HasForeignKey(s => s.AssignedPersonnelId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.WasteType).WithMany()
            .HasForeignKey(s => s.WasteTypeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.ProcessType).WithMany()
            .HasForeignKey(s => s.ProcessTypeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.ResultGroup).WithMany()
            .HasForeignKey(s => s.ResultGroupId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.Product).WithMany()
            .HasForeignKey(s => s.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(s => s.Shelf).WithMany()
            .HasForeignKey(s => s.ShelfId).OnDelete(DeleteBehavior.Restrict);
    }
}
