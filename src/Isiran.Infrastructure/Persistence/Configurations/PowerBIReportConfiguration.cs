using Isiran.Domain.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class PowerBIReportConfiguration : IEntityTypeConfiguration<PowerBIReport>
    {
        public void Configure(EntityTypeBuilder<PowerBIReport> builder)
        {
            builder.ToTable("PowerBIReports");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.ReportId)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(x => x.EmbedUrl)
                .HasMaxLength(1000);

            builder.Property(x => x.WorkspaceId)
                .HasMaxLength(200);

            builder.Property(x => x.DatasetId)
                .HasMaxLength(200);

            builder.HasIndex(x => x.ProjectId);
            builder.HasIndex(x => x.ReportId)
                .IsUnique();

            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.Property(x => x.UpdatedAt)
                .IsRequired();
        }
    }
}

