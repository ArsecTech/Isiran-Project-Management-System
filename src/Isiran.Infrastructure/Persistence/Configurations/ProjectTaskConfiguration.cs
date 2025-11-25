using Isiran.Domain.Tasks;
using Isiran.Domain.Tasks.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations;

public class ProjectTaskConfiguration : IEntityTypeConfiguration<ProjectTask>
{
    public void Configure(EntityTypeBuilder<ProjectTask> builder)
    {
        builder.ToTable("Tasks");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Description)
            .HasMaxLength(2000);

        builder.Property(t => t.JiraIssueKey)
            .HasMaxLength(100);

        builder.Property(t => t.JiraIssueId)
            .HasMaxLength(100);

        builder.Property(t => t.Type)
            .HasConversion<int>();

        builder.Property(t => t.Status)
            .HasConversion<int>();

        builder.Property(t => t.Priority)
            .HasConversion<int>();

        builder.Property(t => t.Constraint)
            .HasConversion<int>();

        builder.Property(t => t.EstimatedEffort)
            .HasPrecision(18, 2);

        builder.Property(t => t.ActualEffort)
            .HasPrecision(18, 2);

        builder.Property(t => t.EstimatedCost)
            .HasPrecision(18, 2);

        builder.Property(t => t.ActualCost)
            .HasPrecision(18, 2);

        builder.Property(t => t.PercentComplete);
        builder.Property(t => t.SelfReportedProgress);
        builder.Property(t => t.ApprovedProgress);

        builder.OwnsOne(t => t.WbsCode, wbs =>
        {
            wbs.Property(w => w.Code)
                .HasColumnName("WbsCode")
                .HasMaxLength(100);
            wbs.Property(w => w.Level)
                .HasColumnName("WbsLevel");
        });

        builder.HasOne(t => t.ParentTask)
            .WithMany(t => t.SubTasks)
            .HasForeignKey(t => t.ParentTaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(t => t.AssignedTo)
            .WithMany()
            .HasForeignKey(t => t.AssignedToId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(t => t.Dependencies)
            .WithOne(d => d.SuccessorTask)
            .HasForeignKey(d => d.SuccessorTaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Resources)
            .WithOne(tr => tr.Task)
            .HasForeignKey(tr => tr.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.TimeEntries)
            .WithOne(te => te.Task)
            .HasForeignKey(te => te.TaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(t => t.ProjectId);
        builder.HasIndex(t => t.ParentTaskId);
        builder.HasIndex(t => t.AssignedToId);
        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.JiraIssueKey);
        builder.HasIndex(t => new { t.ProjectId, t.DisplayOrder });
    }
}

