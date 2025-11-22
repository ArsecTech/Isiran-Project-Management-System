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
                .HasMaxLength(100)
                .HasDefaultValue("Standard");
            
            calendar.Property(c => c.WorkingHoursPerDay)
                .HasDefaultValue(8);
            
            calendar.Property(c => c.WorkingDaysPerWeek)
                .HasDefaultValue(5);
            
            // Configure collections to be stored as JSON
            calendar.Property(c => c.WorkingDays)
                .HasConversion(
                    v => string.Join(",", v.Select(d => ((int)d).ToString())),
                    v => string.IsNullOrEmpty(v) 
                        ? new List<DayOfWeek>() 
                        : v.Split(new[] { "," }, StringSplitOptions.None)
                            .Select(s => (DayOfWeek)int.Parse(s))
                            .ToList())
                .HasColumnType("nvarchar(max)");
            
            calendar.Property(c => c.Holidays)
                .HasConversion(
                    v => string.Join(",", v.Select(d => d.ToString("O"))),
                    v => string.IsNullOrEmpty(v)
                        ? new List<DateTime>()
                        : v.Split(new[] { "," }, StringSplitOptions.None)
                            .Select(s => DateTime.Parse(s))
                            .ToList())
                .HasColumnType("nvarchar(max)");
            
            calendar.Property(c => c.TimeOff)
                .HasConversion(
                    v => System.Text.Json.JsonSerializer.Serialize(v, (System.Text.Json.JsonSerializerOptions?)null),
                    v => string.IsNullOrEmpty(v)
                        ? new List<DateTimeRange>()
                        : System.Text.Json.JsonSerializer.Deserialize<List<DateTimeRange>>(v, (System.Text.Json.JsonSerializerOptions?)null) ?? new List<DateTimeRange>())
                .HasColumnType("nvarchar(max)");
        });

        builder.HasOne(r => r.Manager)
            .WithMany()
            .HasForeignKey(r => r.ManagerId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(r => r.Email)
            .IsUnique();

        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.Type);
    }
}

