using Isiran.Domain.Common;
using Isiran.Domain.Resources;

namespace Isiran.Domain.Tasks;

public class TaskTimeEntry : BaseEntity
{
    public Guid TaskId { get; private set; }
    public Guid ResourceId { get; private set; }
    public DateTime Date { get; private set; }
    public decimal Hours { get; private set; }
    public string? Description { get; private set; }
    public bool IsBillable { get; private set; }
    public decimal? HourlyRate { get; private set; }

    // Navigation properties
    public virtual ProjectTask Task { get; private set; } = null!;
    public virtual Resource Resource { get; private set; } = null!;

    private TaskTimeEntry() { }

    public TaskTimeEntry(
        Guid taskId,
        Guid resourceId,
        DateTime date,
        decimal hours,
        string? description = null,
        bool isBillable = true,
        decimal? hourlyRate = null)
    {
        TaskId = taskId;
        ResourceId = resourceId;
        Date = date;
        Hours = hours;
        Description = description;
        IsBillable = isBillable;
        HourlyRate = hourlyRate;
    }

    public void UpdateHours(decimal hours, string? description = null)
    {
        Hours = hours;
        if (description != null) Description = description;
        UpdateTimestamp();
    }
}

