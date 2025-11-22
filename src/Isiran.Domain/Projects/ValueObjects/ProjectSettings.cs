namespace Isiran.Domain.Projects.ValueObjects;

public class ProjectSettings
{
    public bool AutoSchedule { get; set; } = true;
    public bool CriticalPathEnabled { get; set; } = true;
    public bool ResourceLevelingEnabled { get; set; } = true;
    public int WorkingHoursPerDay { get; set; } = 8;
    public int WorkingDaysPerWeek { get; set; } = 5;
    public string CalendarId { get; set; } = "Standard";
    public bool AllowOvertime { get; set; } = false;
    public decimal DefaultHourlyRate { get; set; } = 0;
    public string Currency { get; set; } = "USD";
    public string TimeZone { get; set; } = "UTC";
}

