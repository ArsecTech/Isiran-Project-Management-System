namespace Isiran.Domain.Resources.ValueObjects;

public class ResourceCalendar
{
    public string CalendarId { get; set; } = "Standard";
    public int WorkingHoursPerDay { get; set; } = 8;
    public int WorkingDaysPerWeek { get; set; } = 5;
    public List<DayOfWeek> WorkingDays { get; set; } = new() 
    { 
        DayOfWeek.Monday, 
        DayOfWeek.Tuesday, 
        DayOfWeek.Wednesday, 
        DayOfWeek.Thursday, 
        DayOfWeek.Friday 
    };
    public List<DateTime> Holidays { get; set; } = new();
    public List<DateTimeRange> TimeOff { get; set; } = new();

    public bool IsWorkingDay(DateTime date)
    {
        if (Holidays.Contains(date.Date)) return false;
        if (TimeOff.Any(to => date >= to.Start && date <= to.End)) return false;
        return WorkingDays.Contains(date.DayOfWeek);
    }

    public decimal GetAvailableHours(DateTime date)
    {
        if (!IsWorkingDay(date)) return 0;
        return WorkingHoursPerDay;
    }
}

public class DateTimeRange
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }

    public DateTimeRange(DateTime start, DateTime end)
    {
        Start = start;
        End = end;
    }
}

