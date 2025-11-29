using Isiran.Domain.Resources;
using Isiran.Domain.Resources.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Isiran.Infrastructure.Persistence.Configurations;

public class ResourceConfiguration : IEntityTypeConfiguration<Resource>
{
    public void Configure(EntityTypeBuilder<Resource> builder)
    {
        builder.ToTable("Resources");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(r => r.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(r => r.PhoneNumber)
            .HasMaxLength(50);

        builder.Property(r => r.Type)
            .HasConversion<int>();

        builder.Property(r => r.Status)
            .HasConversion<int>();

        builder.Property(r => r.MaxUnits)
            .HasPrecision(5, 2);

        builder.Property(r => r.StandardRate)
            .HasPrecision(18, 2);

        builder.Property(r => r.OvertimeRate)
            .HasPrecision(18, 2);

        builder.Property(r => r.Department)
            .HasMaxLength(100);

        builder.Property(r => r.JobTitle)
            .HasMaxLength(100);

        builder.OwnsOne(r => r.Calendar, calendar =>
        {
            calendar.Property(c => c.CalendarId)
                .HasColumnName("CalendarId")
                .HasMaxLength(100)
                .HasDefaultValue("Standard");
            
            calendar.Property(c => c.WorkingHoursPerDay)
                .HasColumnName("WorkingHoursPerDay")
                .HasDefaultValue(8);
            
            calendar.Property(c => c.WorkingDaysPerWeek)
                .HasColumnName("WorkingDaysPerWeek")
                .HasDefaultValue(5);
            
            // Configure collections to be stored as JSON or ignore if not in database
            calendar.Ignore(c => c.WorkingDays);
            calendar.Ignore(c => c.Holidays);
            calendar.Ignore(c => c.TimeOff);
        });

        builder.HasOne(r => r.Manager)
            .WithMany(r => r.TeamMembers)
            .HasForeignKey(r => r.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(r => r.Organization)
            .WithMany()
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);

        // Navigation properties are configured in their respective entity configurations
        // (TaskResource and ProjectResource) to avoid circular references

        builder.HasIndex(r => r.Email)
            .IsUnique();

        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.Type);
        builder.HasIndex(r => r.OrganizationId);
    }
}

