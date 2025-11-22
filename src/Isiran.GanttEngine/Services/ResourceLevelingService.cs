using Isiran.Core.Interfaces;
using Isiran.Domain.Projects;
using Isiran.Domain.Tasks;
using Microsoft.Extensions.Logging;

namespace Isiran.GanttEngine.Services;

public interface IResourceLevelingService
{
    Task<ResourceLevelingResult> LevelResourcesAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public class ResourceLevelingResult
{
    public List<TaskAdjustment> TaskAdjustments { get; set; } = new();
    public List<ResolvedResourceOverload> ResolvedOverloads { get; set; } = new();
    public int TotalDelays { get; set; }
}

public class TaskAdjustment
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public DateTime? OriginalStartDate { get; set; }
    public DateTime? AdjustedStartDate { get; set; }
    public int DelayDays { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ResolvedResourceOverload
{
    public Guid ResourceId { get; set; }
    public string ResourceName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public decimal OriginalAllocation { get; set; }
    public decimal AdjustedAllocation { get; set; }
}

public class ResourceLevelingService : IResourceLevelingService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly ILogger<ResourceLevelingService> _logger;

    public ResourceLevelingService(
        IRepository<Project> projectRepository,
        IRepository<ProjectTask> taskRepository,
        ILogger<ResourceLevelingService> logger)
    {
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _logger = logger;
    }

    public async Task<ResourceLevelingResult> LevelResourcesAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting resource leveling for project: {ProjectId}", projectId);

        var result = new ResourceLevelingResult();
        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new InvalidOperationException($"Project with ID {projectId} not found.");
        }

        var tasks = await _taskRepository.FindAsync(
            t => t.ProjectId == projectId && !t.IsDeleted,
            cancellationToken);

        var taskList = tasks.ToList();

        // Build resource allocation timeline
        var resourceAllocations = BuildResourceAllocationTimeline(taskList);

        // Identify overloads
        var overloads = IdentifyOverloads(resourceAllocations);

        // Level resources using forward scheduling
        foreach (var overload in overloads)
        {
            var affectedTasks = GetTasksForResourceOnDate(taskList, overload.ResourceId, overload.Date);
            
            // Sort tasks by priority and start date
            var sortedTasks = affectedTasks
                .OrderByDescending(t => t.Priority)
                .ThenBy(t => t.StartDate)
                .ToList();

            // Delay lower priority tasks
            for (int i = 1; i < sortedTasks.Count; i++)
            {
                var task = sortedTasks[i];
                var originalStart = task.StartDate;
                
                // Calculate delay needed
                var delayDays = CalculateDelayNeeded(overload, task);
                
                if (delayDays > 0 && originalStart.HasValue)
                {
                    var newStartDate = originalStart.Value.AddDays(delayDays);
                    task.UpdateDates(newStartDate, task.EndDate?.AddDays(delayDays));

                    result.TaskAdjustments.Add(new TaskAdjustment
                    {
                        TaskId = task.Id,
                        TaskName = task.Name,
                        OriginalStartDate = originalStart,
                        AdjustedStartDate = newStartDate,
                        DelayDays = delayDays,
                        Reason = $"Resource leveling for {overload.ResourceName}"
                    });

                    result.TotalDelays += delayDays;
                }
            }

            // Mark overload as resolved
            result.ResolvedOverloads.Add(new ResolvedResourceOverload
            {
                ResourceId = overload.ResourceId,
                ResourceName = overload.ResourceName,
                Date = overload.Date,
                OriginalAllocation = overload.RequiredAllocation,
                AdjustedAllocation = 100 // Assuming we level to 100%
            });
        }

        _logger.LogInformation("Resource leveling completed. {AdjustmentCount} tasks adjusted, {TotalDelays} total delay days",
            result.TaskAdjustments.Count, result.TotalDelays);

        return result;
    }

    private Dictionary<Guid, Dictionary<DateTime, decimal>> BuildResourceAllocationTimeline(List<ProjectTask> tasks)
    {
        var timeline = new Dictionary<Guid, Dictionary<DateTime, decimal>>();

        foreach (var task in tasks)
        {
            if (task.Resources == null || !task.StartDate.HasValue) continue;

            var startDate = task.StartDate.Value.Date;
            var endDate = task.EndDate?.Date ?? startDate.AddDays(task.Duration);

            foreach (var taskResource in task.Resources)
            {
                if (!timeline.ContainsKey(taskResource.ResourceId))
                {
                    timeline[taskResource.ResourceId] = new Dictionary<DateTime, decimal>();
                }

                for (var date = startDate; date <= endDate; date = date.AddDays(1))
                {
                    if (!timeline[taskResource.ResourceId].ContainsKey(date))
                    {
                        timeline[taskResource.ResourceId][date] = 0;
                    }

                    timeline[taskResource.ResourceId][date] += taskResource.AllocationPercentage;
                }
            }
        }

        return timeline;
    }

    private List<ResourceOverload> IdentifyOverloads(Dictionary<Guid, Dictionary<DateTime, decimal>> allocations)
    {
        var overloads = new List<ResourceOverload>();

        foreach (var resourceAlloc in allocations)
        {
            foreach (var dateAlloc in resourceAlloc.Value)
            {
                if (dateAlloc.Value > 100)
                {
                    overloads.Add(new ResourceOverload
                    {
                        ResourceId = resourceAlloc.Key,
                        ResourceName = "Resource", // Would need to load resource name
                        Date = dateAlloc.Key,
                        RequiredAllocation = dateAlloc.Value,
                        AvailableAllocation = 100
                    });
                }
            }
        }

        return overloads.OrderBy(o => o.Date).ToList();
    }

    private List<ProjectTask> GetTasksForResourceOnDate(List<ProjectTask> tasks, Guid resourceId, DateTime date)
    {
        return tasks.Where(t =>
            t.Resources != null &&
            t.Resources.Any(tr => tr.ResourceId == resourceId) &&
            t.StartDate.HasValue &&
            t.StartDate.Value.Date <= date &&
            (t.EndDate == null || t.EndDate.Value.Date >= date)
        ).ToList();
    }

    private int CalculateDelayNeeded(ResourceOverload overload, ProjectTask task)
    {
        // Simple calculation: delay by the excess percentage
        var excess = overload.RequiredAllocation - 100;
        // Assume 1 day delay per 50% excess
        return (int)Math.Ceiling(excess / 50);
    }
}

