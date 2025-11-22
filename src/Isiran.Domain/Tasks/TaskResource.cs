using Isiran.Domain.Common;
using Isiran.Domain.Resources;

namespace Isiran.Domain.Tasks;

public class TaskResource : BaseEntity
{
    public Guid TaskId { get; private set; }
    public Guid ResourceId { get; private set; }
    public decimal AllocationPercentage { get; private set; }
    public decimal? EstimatedHours { get; private set; }
    public decimal? ActualHours { get; private set; }
    public decimal HourlyRate { get; private set; }

    // Navigation properties
    public virtual ProjectTask Task { get; private set; } = null!;
    public virtual Resource Resource { get; private set; } = null!;

    private TaskResource() { }

    public TaskResource(
        Guid taskId,
        Guid resourceId,
        decimal allocationPercentage,
        decimal? estimatedHours = null,
        decimal hourlyRate = 0)
    {
        TaskId = taskId;
        ResourceId = resourceId;
        AllocationPercentage = allocationPercentage;
        EstimatedHours = estimatedHours;
        HourlyRate = hourlyRate;
    }

    public void UpdateAllocation(decimal allocationPercentage, decimal? estimatedHours = null)
    {
        AllocationPercentage = allocationPercentage;
        if (estimatedHours.HasValue) EstimatedHours = estimatedHours;
        UpdateTimestamp();
    }

    public void RecordActualHours(decimal actualHours)
    {
        ActualHours = (ActualHours ?? 0) + actualHours;
        UpdateTimestamp();
    }
}

