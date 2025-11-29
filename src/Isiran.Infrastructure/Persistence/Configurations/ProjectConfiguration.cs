using Isiran.Domain.Projects;
using Isiran.Domain.Projects.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace Isiran.Infrastructure.Persistence.Configurations;

public class ProjectConfiguration : IEntityTypeConfiguration<Project>
{
    public void Configure(EntityTypeBuilder<Project> builder)
    {
        builder.ToTable("Projects");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        builder.Property(p => p.Status)
            .HasConversion<int>();

        builder.Property(p => p.Priority)
            .HasConversion<int>();

        builder.Property(p => p.Budget)
            .HasPrecision(18, 2);

        builder.Property(p => p.ActualCost)
            .HasPrecision(18, 2);

        // Store Settings as JSON column
        // Note: If you have existing columns (AutoSchedule, CriticalPathEnabled, etc.) in the database,
        // you need to run the migration script: database/MigrateProjectSettingsToJson.sql
        builder.OwnsOne(p => p.Settings, settings =>
        {
            settings.ToJson();
        });

        // Ignore old Settings columns if they exist in the database
        // These will be migrated to JSON by the migration script
        builder.Ignore("AutoSchedule");
        builder.Ignore("CriticalPathEnabled");
        builder.Ignore("ResourceLevelingEnabled");
        builder.Ignore("WorkingHoursPerDay");
        builder.Ignore("WorkingDaysPerWeek");
        builder.Ignore("CalendarId");
        builder.Ignore("AllowOvertime");
        builder.Ignore("DefaultHourlyRate");
        builder.Ignore("Currency");
        builder.Ignore("TimeZone");

        builder.HasMany(p => p.Tasks)
            .WithOne(t => t.Project)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Resources)
            .WithOne(pr => pr.Project)
            .HasForeignKey(pr => pr.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Milestones)
            .WithOne(m => m.Project)
            .HasForeignKey(m => m.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(p => p.Nature)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(p => p.Center)
            .HasMaxLength(200);

        builder.Property(p => p.SelfReportedProgress);

        builder.Property(p => p.ApprovedProgress);

        builder.Property(p => p.LastUpdatedByExecutor);

        builder.Property(p => p.LastApprovedByClient);

        builder.HasOne(p => p.Organization)
            .WithMany()
            .HasForeignKey(p => p.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(p => p.Code)
            .IsUnique();

        builder.HasIndex(p => p.Name);
        builder.HasIndex(p => p.Status);
        builder.HasIndex(p => p.ProjectManagerId);
        builder.HasIndex(p => p.Nature);
        builder.HasIndex(p => p.Center);
        builder.HasIndex(p => p.OrganizationId);
    }
}

