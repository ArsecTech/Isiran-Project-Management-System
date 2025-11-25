using Isiran.Domain.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class SyncLogConfiguration : IEntityTypeConfiguration<SyncLog>
    {
        public void Configure(EntityTypeBuilder<SyncLog> builder)
        {
            builder.ToTable("SyncLogs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.IntegrationType)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(x => x.Status)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(x => x.ErrorMessage)
                .HasMaxLength(int.MaxValue);

            builder.Property(x => x.CreatedByUserId)
                .HasColumnName("CreatedBy"); // Map to database column name

            builder.HasIndex(x => x.ProjectId);
            builder.HasIndex(x => x.IntegrationType);
            builder.HasIndex(x => x.Status);
            builder.HasIndex(x => x.StartTime);

            builder.Property(x => x.CreatedAt)
                .IsRequired();
        }
    }
}

