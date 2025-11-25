using Isiran.Domain.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class KPIMetricConfiguration : IEntityTypeConfiguration<KPIMetric>
    {
        public void Configure(EntityTypeBuilder<KPIMetric> builder)
        {
            builder.ToTable("KPIMetrics");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.ProjectId)
                .IsRequired();

            builder.Property(x => x.MetricDate)
                .IsRequired();

            builder.Property(x => x.CPI)
                .HasPrecision(18, 4);

            builder.Property(x => x.SPI)
                .HasPrecision(18, 4);

            builder.Property(x => x.EV)
                .HasPrecision(18, 2);

            builder.Property(x => x.PV)
                .HasPrecision(18, 2);

            builder.Property(x => x.AC)
                .HasPrecision(18, 2);

            builder.Property(x => x.BAC)
                .HasPrecision(18, 2);

            builder.Property(x => x.EAC)
                .HasPrecision(18, 2);

            builder.Property(x => x.ETC)
                .HasPrecision(18, 2);

            builder.Property(x => x.VAC)
                .HasPrecision(18, 2);

            builder.HasIndex(x => x.ProjectId);
            builder.HasIndex(x => x.MetricDate);

            builder.HasIndex(x => new { x.ProjectId, x.MetricDate })
                .IsUnique();

            builder.Property(x => x.CreatedAt)
                .IsRequired();
        }
    }
}

