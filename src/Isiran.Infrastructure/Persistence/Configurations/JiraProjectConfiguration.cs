using Isiran.Domain.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class JiraProjectConfiguration : IEntityTypeConfiguration<JiraProject>
    {
        public void Configure(EntityTypeBuilder<JiraProject> builder)
        {
            builder.ToTable("JiraProjects");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.ProjectId)
                .IsRequired();

            builder.Property(x => x.JiraProjectKey)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(x => x.JiraProjectId)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(x => x.JiraProjectName)
                .IsRequired()
                .HasMaxLength(500);

            builder.HasIndex(x => x.ProjectId)
                .IsUnique();

            builder.HasIndex(x => x.JiraProjectKey)
                .IsUnique();

            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.Property(x => x.UpdatedAt)
                .IsRequired();
        }
    }
}

