namespace Isiran.Application.TimeTracking.Queries;

public class GetTimeEntryListDto
{
    public Guid Id { get; set; }
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public Guid ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal Hours { get; set; }
    public string? Description { get; set; }
    public bool IsBillable { get; set; }
    public decimal? HourlyRate { get; set; }
    public decimal? Cost { get; set; }
}

