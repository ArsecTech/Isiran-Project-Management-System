using Isiran.Domain.Integrations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class ConfluencePageConfiguration : IEntityTypeConfiguration<ConfluencePage>
    {
        public void Configure(EntityTypeBuilder<ConfluencePage> builder)
        {
            builder.ToTable("ConfluencePages");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.ProjectId)
                .IsRequired();

            builder.Property(x => x.PageId)
                .IsRequired()
                .HasMaxLength(100);

            builder.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(500);

            builder.Property(x => x.Content)
                .HasMaxLength(int.MaxValue);

            builder.Property(x => x.Url)
                .IsRequired()
                .HasMaxLength(1000);

            builder.Property(x => x.SpaceKey)
                .HasMaxLength(100);

            builder.HasIndex(x => x.ProjectId);
            builder.HasIndex(x => x.PageId)
                .IsUnique();

            builder.Property(x => x.CreatedAt)
                .IsRequired();

            builder.Property(x => x.UpdatedAt)
                .IsRequired();
        }
    }
}

