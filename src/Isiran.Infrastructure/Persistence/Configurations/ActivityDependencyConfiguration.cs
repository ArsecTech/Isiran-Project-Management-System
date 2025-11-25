using Isiran.Domain.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations
{
    public class ActivityDependencyConfiguration : IEntityTypeConfiguration<ActivityDependency>
    {
        public void Configure(EntityTypeBuilder<ActivityDependency> builder)
        {
            builder.ToTable("ActivityDependencies");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.DependencyType)
                .IsRequired()
                .HasConversion<int>();

            builder.HasIndex(x => x.PredecessorActivityId);
            builder.HasIndex(x => x.SuccessorActivityId);

            builder.Property(x => x.CreatedAt)
                .IsRequired();
        }
    }
}

