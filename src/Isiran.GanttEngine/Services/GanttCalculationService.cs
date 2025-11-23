using Isiran.Core.Interfaces;
using Isiran.Domain.Projects;
using Isiran.Domain.Tasks;
using Microsoft.Extensions.Logging;
using System.Collections.Generic;

namespace Isiran.GanttEngine.Services;

public class GanttCalculationService : IGanttCalculationService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly ILogger<GanttCalculationService> _logger;

    public GanttCalculationService(
        IRepository<Project> projectRepository,
        IRepository<ProjectTask> taskRepository,
        ILogger<GanttCalculationService> logger)
    {
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _logger = logger;
    }

    public async Task<GanttCalculationResult> CalculateScheduleAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Calculating schedule for project: {ProjectId}", projectId);

        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new InvalidOperationException($"Project with ID {projectId} not found.");
        }

        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId && !t.IsDeleted, cancellationToken);
        var taskList = tasks.ToList();

        // Calculate hierarchy levels
        var taskLevelMap = new Dictionary<Guid, int>();
        foreach (var task in taskList)
        {
            if (!task.ParentTaskId.HasValue)
            {
                taskLevelMap[task.Id] = 0;
            }
            else
            {
                var level = 0;
                var currentTask = task;
                while (currentTask.ParentTaskId.HasValue)
                {
                    level++;
                    currentTask = taskList.FirstOrDefault(t => t.Id == currentTask.ParentTaskId.Value);
                    if (currentTask == null) break;
                }
                taskLevelMap[task.Id] = level;
            }
        }

        var result = new GanttCalculationResult
        {
            TaskSchedules = new List<TaskSchedule>()
        };

        // Build dependency graph
        var dependencyGraph = BuildDependencyGraph(taskList);

        // Forward pass: Calculate earliest start and end dates
        var earliestStart = new Dictionary<Guid, DateTime?>();
        var earliestEnd = new Dictionary<Guid, DateTime?>();

        var projectStartDate = project.StartDate ?? DateTime.UtcNow.Date;
        result.ProjectStartDate = projectStartDate;

        // Initialize all tasks
        foreach (var task in taskList)
        {
            if (task.StartDate.HasValue)
            {
                earliestStart[task.Id] = task.StartDate.Value;
            }
            else
            {
                earliestStart[task.Id] = null;
            }
        }

        // Process tasks in topological order
        var processed = new HashSet<Guid>();
        var queue = new Queue<ProjectTask>(taskList.Where(t => !dependencyGraph.ContainsKey(t.Id) || !dependencyGraph[t.Id].Any()));

        while (queue.Count > 0)
        {
            var task = queue.Dequeue();
            if (processed.Contains(task.Id)) continue;

            // Check if all predecessors are processed
            var predecessors = dependencyGraph.ContainsKey(task.Id) 
                ? dependencyGraph[task.Id] 
                : new List<(ProjectTask task, TaskDependency dep)>();

            if (predecessors.Any(p => !processed.Contains(p.task.Id)))
            {
                continue;
            }

            processed.Add(task.Id);

            // Calculate earliest start
            DateTime? taskStart = null;
            if (task.StartDate.HasValue)
            {
                taskStart = task.StartDate.Value;
            }
            else if (predecessors.Any())
            {
                var maxPredecessorEnd = predecessors
                    .Select(p => CalculatePredecessorEndDate(p.task, p.dep, earliestEnd))
                    .Where(d => d.HasValue)
                    .DefaultIfEmpty(projectStartDate)
                    .Max();

                taskStart = maxPredecessorEnd;
            }
            else
            {
                taskStart = projectStartDate;
            }

            earliestStart[task.Id] = taskStart;
            if (taskStart.HasValue)
            {
                earliestEnd[task.Id] = taskStart.Value.AddDays(task.Duration);
            }
            else
            {
                earliestEnd[task.Id] = null;
            }

            // Add to result
            result.TaskSchedules.Add(new TaskSchedule
            {
                TaskId = task.Id,
                TaskName = task.Name,
                CalculatedStartDate = taskStart,
                CalculatedEndDate = earliestEnd[task.Id],
                CalculatedDuration = task.Duration,
                ParentTaskId = task.ParentTaskId,
                Level = taskLevelMap.ContainsKey(task.Id) ? taskLevelMap[task.Id] : 0,
                PercentComplete = task.PercentComplete,
                Status = (int)task.Status
            });

            // Add successors to queue
            var successors = taskList
                .Where(t => t.Dependencies != null && t.Dependencies.Any(d => d.PredecessorTaskId == task.Id))
                .Where(t => !processed.Contains(t.Id));

            foreach (var successor in successors)
            {
                queue.Enqueue(successor);
            }
        }

        // Calculate project end date
        if (earliestEnd.Values.Any())
        {
            result.ProjectEndDate = earliestEnd.Values.Max();
            if (result.ProjectEndDate.HasValue && result.ProjectStartDate.HasValue)
            {
                result.TotalDuration = (int)(result.ProjectEndDate.Value - result.ProjectStartDate.Value).TotalDays;
            }
        }

        // Calculate critical path
        var criticalPathTasks = await CalculateCriticalPathAsync(projectId, cancellationToken);
        var criticalPathTaskIds = criticalPathTasks.Select(t => t.TaskId).ToHashSet();

        foreach (var schedule in result.TaskSchedules)
        {
            schedule.IsOnCriticalPath = criticalPathTaskIds.Contains(schedule.TaskId);
        }

        return result;
    }

    public async Task<List<SimpleCriticalPathTask>> CalculateCriticalPathAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId && !t.IsDeleted, cancellationToken);
        var taskList = tasks.ToList();

        // Simplified critical path calculation
        // In production, use CPM (Critical Path Method) algorithm
        var criticalPath = new List<SimpleCriticalPathTask>();

        var dependencyGraph = BuildDependencyGraph(taskList);
        var longestPath = FindLongestPath(taskList, dependencyGraph);

        foreach (var taskId in longestPath)
        {
            var task = taskList.FirstOrDefault(t => t.Id == taskId);
            if (task != null)
            {
                criticalPath.Add(new SimpleCriticalPathTask
                {
                    TaskId = task.Id,
                    TaskName = task.Name,
                    StartDate = task.StartDate,
                    EndDate = task.EndDate,
                    Duration = task.Duration
                });
            }
        }

        return criticalPath;
    }

    public async Task<ResourceAllocationResult> CalculateResourceAllocationAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId && !t.IsDeleted, cancellationToken);
        var taskList = tasks.ToList();

        var result = new ResourceAllocationResult
        {
            Allocations = new List<ResourceAllocation>(),
            Overloads = new List<ResourceOverload>()
        };

        // Group by resource and date
        var resourceAllocations = new Dictionary<Guid, Dictionary<DateTime, decimal>>();

        foreach (var task in taskList)
        {
            if (task.Resources == null) continue;

            foreach (var taskResource in task.Resources)
            {
                if (!resourceAllocations.ContainsKey(taskResource.ResourceId))
                {
                    resourceAllocations[taskResource.ResourceId] = new Dictionary<DateTime, decimal>();
                }

                var startDate = task.StartDate ?? DateTime.UtcNow.Date;
                var endDate = task.EndDate ?? startDate.AddDays(task.Duration);

                for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    if (!resourceAllocations[taskResource.ResourceId].ContainsKey(date))
                    {
                        resourceAllocations[taskResource.ResourceId][date] = 0;
                    }

                    resourceAllocations[taskResource.ResourceId][date] += taskResource.AllocationPercentage;
                }
            }
        }

        // Build allocation result
        foreach (var resourceAlloc in resourceAllocations)
        {
            foreach (var dateAlloc in resourceAlloc.Value)
            {
                result.Allocations.Add(new ResourceAllocation
                {
                    ResourceId = resourceAlloc.Key,
                    ResourceName = "Resource", // Would need to load resource name
                    Date = dateAlloc.Key,
                    AllocationPercentage = dateAlloc.Value,
                    Hours = dateAlloc.Value * 8 / 100 // Assuming 8 hours per day
                });

                // Check for overload (assuming max 100%)
                if (dateAlloc.Value > 100)
                {
                    result.Overloads.Add(new ResourceOverload
                    {
                        ResourceId = resourceAlloc.Key,
                        ResourceName = "Resource",
                        Date = dateAlloc.Key,
                        RequiredAllocation = dateAlloc.Value,
                        AvailableAllocation = 100
                    });
                }
            }
        }

        return result;
    }

    private Dictionary<Guid, List<(ProjectTask task, TaskDependency dep)>> BuildDependencyGraph(List<ProjectTask> tasks)
    {
        var graph = new Dictionary<Guid, List<(ProjectTask task, TaskDependency dep)>>();

        foreach (var task in tasks)
        {
            if (task.Dependencies == null) continue;

            foreach (var dep in task.Dependencies)
            {
                var predecessor = tasks.FirstOrDefault(t => t.Id == dep.PredecessorTaskId);
                if (predecessor != null)
                {
                    if (!graph.ContainsKey(task.Id))
                    {
                        graph[task.Id] = new List<(ProjectTask task, TaskDependency dep)>();
                    }
                    graph[task.Id].Add((predecessor, dep));
                }
            }
        }

        return graph;
    }

    private DateTime? CalculatePredecessorEndDate(ProjectTask predecessor, TaskDependency dependency, Dictionary<Guid, DateTime?> earliestEnd)
    {
        if (!earliestEnd.TryGetValue(predecessor.Id, out var endDate) || !endDate.HasValue)
        {
            return null;
        }

        var baseDate = endDate.Value;

        switch (dependency.Type)
        {
            case DependencyType.FinishToStart:
                return baseDate.AddDays(dependency.Lag);
            case DependencyType.StartToStart:
                return predecessor.StartDate?.AddDays(dependency.Lag);
            case DependencyType.FinishToFinish:
                return baseDate.AddDays(dependency.Lag);
            case DependencyType.StartToFinish:
                return predecessor.StartDate?.AddDays(dependency.Lag);
            default:
                return baseDate.AddDays(dependency.Lag);
        }
    }

    private List<Guid> FindLongestPath(List<ProjectTask> tasks, Dictionary<Guid, List<(ProjectTask task, TaskDependency dep)>> graph)
    {
        // Simplified longest path algorithm
        // In production, use proper CPM algorithm
        var path = new List<Guid>();
        var visited = new HashSet<Guid>();

        var startTasks = tasks.Where(t => !graph.ContainsKey(t.Id) || !graph[t.Id].Any()).ToList();
        if (!startTasks.Any()) return path;

        var currentTask = startTasks.OrderByDescending(t => t.Duration).First();
        path.Add(currentTask.Id);
        visited.Add(currentTask.Id);

        while (true)
        {
            var nextTasks = tasks
                .Where(t => !visited.Contains(t.Id) && 
                           t.Dependencies != null &&
                           t.Dependencies.Any(d => d.PredecessorTaskId == currentTask.Id))
                .OrderByDescending(t => t.Duration)
                .ToList();

            if (!nextTasks.Any()) break;

            currentTask = nextTasks.First();
            path.Add(currentTask.Id);
            visited.Add(currentTask.Id);
        }

        return path;
    }
}

