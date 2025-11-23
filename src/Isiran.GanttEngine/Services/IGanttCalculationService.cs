using Isiran.Domain.Tasks;

namespace Isiran.GanttEngine.Services;

public interface IGanttCalculationService
{
    Task<GanttCalculationResult> CalculateScheduleAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<List<SimpleCriticalPathTask>> CalculateCriticalPathAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<ResourceAllocationResult> CalculateResourceAllocationAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public class SimpleCriticalPathTask
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int Duration { get; set; }
}

public class GanttCalculationResult
{
    public List<TaskSchedule> TaskSchedules { get; set; } = new();
    public DateTime? ProjectStartDate { get; set; }
    public DateTime? ProjectEndDate { get; set; }
    public int TotalDuration { get; set; }
}

public class TaskSchedule
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public DateTime? CalculatedStartDate { get; set; }
    public DateTime? CalculatedEndDate { get; set; }
    public int CalculatedDuration { get; set; }
    public bool IsOnCriticalPath { get; set; }
    public int Slack { get; set; }
    public Guid? ParentTaskId { get; set; }
    public int Level { get; set; }
    public int? PercentComplete { get; set; }
    public int Status { get; set; }
}

public class ResourceAllocationResult
{
    public List<ResourceAllocation> Allocations { get; set; } = new();
    public List<ResourceOverload> Overloads { get; set; } = new();
}

public class ResourceAllocation
{
    public Guid ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal AllocationPercentage { get; set; }
    public decimal Hours { get; set; }
}

public class ResourceOverload
{
    public Guid ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal RequiredAllocation { get; set; }
    public decimal AvailableAllocation { get; set; }
}

