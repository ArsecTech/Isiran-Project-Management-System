using Isiran.Domain.Organizations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("Organizations");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(o => o.Code)
            .HasMaxLength(50);

        builder.Property(o => o.Description)
            .HasMaxLength(2000);

        builder.Property(o => o.ManagerId)
            .HasMaxLength(100);

        // Self-referencing relationship for hierarchy
        builder.HasOne(o => o.ParentOrganization)
            .WithMany(o => o.SubOrganizations)
            .HasForeignKey(o => o.ParentOrganizationId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete to avoid data loss

        builder.HasIndex(o => o.Code)
            .IsUnique()
            .HasFilter("[Code] IS NOT NULL");

        builder.HasIndex(o => o.Name);
    }
}

