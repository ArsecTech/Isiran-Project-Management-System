using Isiran.Core.Interfaces;
using Isiran.Domain.Projects;
using Isiran.Domain.Tasks;
using Microsoft.Extensions.Logging;

namespace Isiran.GanttEngine.Services;

public interface IEnhancedCriticalPathService
{
    Task<CriticalPathAnalysis> AnalyzeCriticalPathAsync(Guid projectId, CancellationToken cancellationToken = default);
}

public class CriticalPathAnalysis
{
    public List<CriticalPathTask> CriticalPathTasks { get; set; } = new();
    public DateTime? ProjectStartDate { get; set; }
    public DateTime? ProjectEndDate { get; set; }
    public int TotalDuration { get; set; }
    public List<NonCriticalTask> NonCriticalTasks { get; set; } = new();
    public List<FloatAnalysis> FloatAnalysis { get; set; } = new();
}

public class CriticalPathTask
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public DateTime? EarlyStart { get; set; }
    public DateTime? EarlyFinish { get; set; }
    public DateTime? LateStart { get; set; }
    public DateTime? LateFinish { get; set; }
    public int Duration { get; set; }
    public int TotalFloat { get; set; }
    public int FreeFloat { get; set; }
}

public class NonCriticalTask
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public int TotalFloat { get; set; }
    public int FreeFloat { get; set; }
}

public class FloatAnalysis
{
    public Guid TaskId { get; set; }
    public string TaskName { get; set; } = string.Empty;
    public int TotalFloat { get; set; }
    public int FreeFloat { get; set; }
    public int IndependentFloat { get; set; }
}

public class EnhancedCriticalPathService : IEnhancedCriticalPathService
{
    private readonly IRepository<Project> _projectRepository;
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly ILogger<EnhancedCriticalPathService> _logger;

    public EnhancedCriticalPathService(
        IRepository<Project> projectRepository,
        IRepository<ProjectTask> taskRepository,
        ILogger<EnhancedCriticalPathService> logger)
    {
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _logger = logger;
    }

    public async Task<CriticalPathAnalysis> AnalyzeCriticalPathAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Analyzing critical path for project: {ProjectId}", projectId);

        var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
        if (project == null)
        {
            throw new InvalidOperationException($"Project with ID {projectId} not found.");
        }

        var tasks = await _taskRepository.FindAsync(
            t => t.ProjectId == projectId && !t.IsDeleted,
            cancellationToken);

        var taskList = tasks.ToList();
        var analysis = new CriticalPathAnalysis
        {
            ProjectStartDate = project.StartDate ?? DateTime.UtcNow.Date
        };

        // Build dependency graph
        var dependencyGraph = BuildDependencyGraph(taskList);

        // Forward pass: Calculate Early Start and Early Finish
        var earlyStart = new Dictionary<Guid, DateTime?>();
        var earlyFinish = new Dictionary<Guid, DateTime?>();

        // Initialize all tasks
        foreach (var task in taskList)
        {
            earlyStart[task.Id] = task.StartDate ?? analysis.ProjectStartDate;
        }

        // Process in topological order
        var processed = new HashSet<Guid>();
        var queue = new Queue<ProjectTask>(
            taskList.Where(t => !dependencyGraph.ContainsKey(t.Id) || !dependencyGraph[t.Id].Any()));

        while (queue.Count > 0)
        {
            var task = queue.Dequeue();
            if (processed.Contains(task.Id)) continue;

            var predecessors = dependencyGraph.ContainsKey(task.Id)
                ? dependencyGraph[task.Id]
                : new List<(ProjectTask task, TaskDependency dep)>();

            if (predecessors.Any(p => !processed.Contains(p.task.Id)))
            {
                continue;
            }

            processed.Add(task.Id);

            // Calculate Early Start
            DateTime? taskEarlyStart = earlyStart[task.Id];
            if (predecessors.Any())
            {
                var maxPredecessorFinish = predecessors
                    .Select(p => CalculatePredecessorFinish(p.task, p.dep, earlyFinish))
                    .Where(d => d.HasValue)
                    .DefaultIfEmpty(analysis.ProjectStartDate)
                    .Max();

                taskEarlyStart = maxPredecessorFinish > taskEarlyStart ? maxPredecessorFinish : taskEarlyStart;
            }

            earlyStart[task.Id] = taskEarlyStart;
            earlyFinish[task.Id] = taskEarlyStart.Value.AddDays(task.Duration);
        }

        // Backward pass: Calculate Late Start and Late Finish
        var lateFinish = new Dictionary<Guid, DateTime?>();
        var lateStart = new Dictionary<Guid, DateTime?>();

        // Find project end date
        if (earlyFinish.Values.Any())
        {
            analysis.ProjectEndDate = earlyFinish.Values.Max();
            analysis.TotalDuration = (int)(analysis.ProjectEndDate.Value - analysis.ProjectStartDate.Value).TotalDays;
        }

        // Initialize late finish for terminal tasks
        foreach (var task in taskList)
        {
            var successors = taskList.Where(t =>
                t.Dependencies != null &&
                t.Dependencies.Any(d => d.PredecessorTaskId == task.Id));

            if (!successors.Any())
            {
                lateFinish[task.Id] = analysis.ProjectEndDate;
            }
        }

        // Process in reverse topological order
        var reverseQueue = new Queue<ProjectTask>(
            taskList.Where(t =>
            {
                var successors = taskList.Where(s =>
                    s.Dependencies != null &&
                    s.Dependencies.Any(d => d.PredecessorTaskId == t.Id));
                return !successors.Any();
            }));

        var reverseProcessed = new HashSet<Guid>();

        while (reverseQueue.Count > 0)
        {
            var task = reverseQueue.Dequeue();
            if (reverseProcessed.Contains(task.Id)) continue;

            reverseProcessed.Add(task.Id);

            if (!lateFinish.ContainsKey(task.Id))
            {
                lateFinish[task.Id] = analysis.ProjectEndDate;
            }

            lateStart[task.Id] = lateFinish[task.Id].Value.AddDays(-task.Duration);

            // Update predecessors
            var predecessors = taskList.Where(t =>
                task.Dependencies != null &&
                task.Dependencies.Any(d => d.PredecessorTaskId == t.Id));

            foreach (var predecessor in predecessors)
            {
                if (!lateFinish.ContainsKey(predecessor.Id) ||
                    lateFinish[predecessor.Id] > lateStart[task.Id])
                {
                    lateFinish[predecessor.Id] = lateStart[task.Id];
                }

                if (!reverseProcessed.Contains(predecessor.Id))
                {
                    reverseQueue.Enqueue(predecessor);
                }
            }
        }

        // Identify critical path and calculate floats
        foreach (var task in taskList)
        {
            var es = earlyStart.ContainsKey(task.Id) ? earlyStart[task.Id] : null;
            var ef = earlyFinish.ContainsKey(task.Id) ? earlyFinish[task.Id] : null;
            var ls = lateStart.ContainsKey(task.Id) ? lateStart[task.Id] : null;
            var lf = lateFinish.ContainsKey(task.Id) ? lateFinish[task.Id] : null;

            if (!es.HasValue || !ef.HasValue || !ls.HasValue || !lf.HasValue) continue;

            var totalFloat = (int)(ls.Value - es.Value).TotalDays;
            var freeFloat = CalculateFreeFloat(task, taskList, earlyFinish);

            var criticalTask = new CriticalPathTask
            {
                TaskId = task.Id,
                TaskName = task.Name,
                EarlyStart = es,
                EarlyFinish = ef,
                LateStart = ls,
                LateFinish = lf,
                Duration = task.Duration,
                TotalFloat = totalFloat,
                FreeFloat = freeFloat
            };

            if (totalFloat == 0)
            {
                analysis.CriticalPathTasks.Add(criticalTask);
            }
            else
            {
                analysis.NonCriticalTasks.Add(new NonCriticalTask
                {
                    TaskId = task.Id,
                    TaskName = task.Name,
                    TotalFloat = totalFloat,
                    FreeFloat = freeFloat
                });
            }

            analysis.FloatAnalysis.Add(new FloatAnalysis
            {
                TaskId = task.Id,
                TaskName = task.Name,
                TotalFloat = totalFloat,
                FreeFloat = freeFloat,
                IndependentFloat = CalculateIndependentFloat(task, taskList, earlyStart, lateFinish)
            });
        }

        _logger.LogInformation("Critical path analysis completed. {CriticalTasks} critical tasks found",
            analysis.CriticalPathTasks.Count);

        return analysis;
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

    private DateTime? CalculatePredecessorFinish(ProjectTask predecessor, TaskDependency dependency, Dictionary<Guid, DateTime?> earlyFinish)
    {
        if (!earlyFinish.ContainsKey(predecessor.Id) || !earlyFinish[predecessor.Id].HasValue)
        {
            return null;
        }

        var baseDate = earlyFinish[predecessor.Id].Value;

        return dependency.Type switch
        {
            DependencyType.FinishToStart => baseDate.AddDays(dependency.Lag),
            DependencyType.StartToStart => predecessor.StartDate?.AddDays(dependency.Lag),
            DependencyType.FinishToFinish => baseDate.AddDays(dependency.Lag),
            DependencyType.StartToFinish => predecessor.StartDate?.AddDays(dependency.Lag),
            _ => baseDate.AddDays(dependency.Lag)
        };
    }

    private int CalculateFreeFloat(ProjectTask task, List<ProjectTask> allTasks, Dictionary<Guid, DateTime?> earlyFinish)
    {
        if (task.Dependencies == null || !task.Dependencies.Any())
        {
            return 0;
        }

        var minSuccessorEarlyStart = allTasks
            .Where(t => t.Dependencies != null &&
                       t.Dependencies.Any(d => d.PredecessorTaskId == task.Id))
            .Select(t => earlyFinish.ContainsKey(t.Id) ? earlyFinish[t.Id] : null)
            .Where(d => d.HasValue)
            .DefaultIfEmpty(DateTime.MaxValue)
            .Min();

        if (!minSuccessorEarlyStart.HasValue || minSuccessorEarlyStart == DateTime.MaxValue)
        {
            return 0;
        }

        var taskEarlyFinish = earlyFinish.ContainsKey(task.Id) ? earlyFinish[task.Id] : null;
        if (!taskEarlyFinish.HasValue)
        {
            return 0;
        }

        return (int)(minSuccessorEarlyStart.Value - taskEarlyFinish.Value).TotalDays;
    }

    private int CalculateIndependentFloat(ProjectTask task, List<ProjectTask> allTasks,
        Dictionary<Guid, DateTime?> earlyStart, Dictionary<Guid, DateTime?> lateFinish)
    {
        var taskEarlyStart = earlyStart.ContainsKey(task.Id) ? earlyStart[task.Id] : null;
        var taskLateFinish = lateFinish.ContainsKey(task.Id) ? lateFinish[task.Id] : null;

        if (!taskEarlyStart.HasValue || !taskLateFinish.HasValue)
        {
            return 0;
        }

        var minSuccessorEarlyStart = allTasks
            .Where(t => t.Dependencies != null &&
                       t.Dependencies.Any(d => d.PredecessorTaskId == task.Id))
            .Select(t => earlyStart.ContainsKey(t.Id) ? earlyStart[t.Id] : null)
            .Where(d => d.HasValue)
            .DefaultIfEmpty(DateTime.MaxValue)
            .Min();

        if (!minSuccessorEarlyStart.HasValue || minSuccessorEarlyStart == DateTime.MaxValue)
        {
            return 0;
        }

        var independentFloat = (int)(minSuccessorEarlyStart.Value - taskLateFinish.Value).TotalDays;
        return Math.Max(0, independentFloat);
    }
}

