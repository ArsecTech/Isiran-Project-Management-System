using Isiran.Domain.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class IntegrationConfigConfiguration : IEntityTypeConfiguration<IntegrationConfig>
    {
        public void Configure(EntityTypeBuilder<IntegrationConfig> builder)
        {
            builder.ToTable("IntegrationConfigs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.IntegrationType)
                .IsRequired()
                .HasConversion<int>();

            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.BaseUrl)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(x => x.ClientId)
                .HasMaxLength(500);

            builder.Property(x => x.ClientSecret)
                .HasMaxLength(int.MaxValue);

            builder.Property(x => x.AccessToken)
                .HasMaxLength(int.MaxValue);

            builder.Property(x => x.RefreshToken)
                .HasMaxLength(int.MaxValue);

            builder.HasIndex(x => x.Name)
                .IsUnique();

            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.Property(x => x.UpdatedAt)
                .IsRequired();
        }
    }
}

