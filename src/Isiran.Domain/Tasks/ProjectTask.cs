using Isiran.Domain.Common;
using Isiran.Domain.Projects;
using Isiran.Domain.Resources;
using Isiran.Domain.Tasks.ValueObjects;

namespace Isiran.Domain.Tasks;

public class ProjectTask : AggregateRoot
{
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public TaskType Type { get; private set; }
    public TaskStatus Status { get; private set; }
    public TaskPriority Priority { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public DateTime? ActualStartDate { get; private set; }
    public DateTime? ActualEndDate { get; private set; }
    public int Duration { get; private set; } // in days
    public int ActualDuration { get; private set; } // in days
    public decimal? EstimatedEffort { get; private set; } // in hours
    public decimal? ActualEffort { get; private set; } // in hours
    public decimal? EstimatedCost { get; private set; }
    public decimal? ActualCost { get; private set; }
    public int? PercentComplete { get; private set; }
    public Guid? ParentTaskId { get; private set; }
    public Guid? AssignedToId { get; private set; }
    public int DisplayOrder { get; private set; }
    public TaskConstraint Constraint { get; private set; }
    public string? JiraIssueKey { get; private set; }
    public string? JiraIssueId { get; private set; }
    public DateTime? ConstraintDate { get; private set; }
    public WorkBreakdownStructure WbsCode { get; private set; } = null!;

    // Navigation properties
    public virtual Project Project { get; private set; } = null!;
    public virtual ProjectTask? ParentTask { get; private set; }
    public virtual ICollection<ProjectTask> SubTasks { get; private set; } = new List<ProjectTask>();
    public virtual Resource? AssignedTo { get; private set; }
    public virtual ICollection<TaskDependency> Dependencies { get; private set; } = new List<TaskDependency>();
    public virtual ICollection<TaskResource> Resources { get; private set; } = new List<TaskResource>();
    public virtual ICollection<TaskTimeEntry> TimeEntries { get; private set; } = new List<TaskTimeEntry>();

    private ProjectTask() { }

    public ProjectTask(
        Guid projectId,
        string name,
        TaskType type = TaskType.Task,
        Guid? parentTaskId = null,
        DateTime? startDate = null,
        int? duration = null,
        TaskPriority priority = TaskPriority.Medium,
        string? description = null)
    {
        ProjectId = projectId;
        Name = name;
        Type = type;
        ParentTaskId = parentTaskId;
        Status = TaskStatus.NotStarted;
        Priority = priority;
        Description = description;
        StartDate = startDate;
        Duration = duration ?? 1;
        PercentComplete = 0;
        Constraint = TaskConstraint.AsSoonAsPossible;
        WbsCode = WorkBreakdownStructure.GenerateForParent(null, 0);
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string name,
        string? description = null,
        TaskPriority? priority = null,
        DateTime? startDate = null,
        int? duration = null)
    {
        Name = name;
        if (description != null) Description = description;
        if (priority.HasValue) Priority = priority.Value;
        if (startDate.HasValue) StartDate = startDate;
        if (duration.HasValue) Duration = duration.Value;
        UpdateTimestamp();
    }

    public void ChangeStatus(TaskStatus newStatus)
    {
        if (Status == newStatus) return;

        var oldStatus = Status;
        Status = newStatus;

        if (newStatus == TaskStatus.InProgress && !ActualStartDate.HasValue)
        {
            ActualStartDate = DateTime.UtcNow;
        }

        if (newStatus == TaskStatus.Completed)
        {
            ActualEndDate = DateTime.UtcNow;
            PercentComplete = 100;
            if (ActualStartDate.HasValue)
            {
                ActualDuration = (int)(ActualEndDate.Value - ActualStartDate.Value).TotalDays;
            }
        }

        UpdateTimestamp();
        AddDomainEvent(new TaskStatusChangedEvent(Id, ProjectId, oldStatus, newStatus));
    }

    public void UpdateProgress(int percentComplete)
    {
        PercentComplete = Math.Clamp(percentComplete, 0, 100);
        UpdateTimestamp();
    }

    public void AssignTo(Guid? resourceId)
    {
        AssignedToId = resourceId;
        UpdateTimestamp();
    }

    public void SetConstraint(TaskConstraint constraint, DateTime? constraintDate = null)
    {
        Constraint = constraint;
        ConstraintDate = constraintDate;
        UpdateTimestamp();
    }

    public void UpdateDates(DateTime? startDate, DateTime? endDate)
    {
        StartDate = startDate;
        EndDate = endDate;
        if (startDate.HasValue && endDate.HasValue)
        {
            Duration = (int)(endDate.Value - startDate.Value).TotalDays;
        }
        UpdateTimestamp();
    }

    public void UpdateEffort(decimal? estimatedEffort, decimal? actualEffort = null)
    {
        EstimatedEffort = estimatedEffort;
        if (actualEffort.HasValue) ActualEffort = actualEffort;
        UpdateTimestamp();
    }

    public void UpdateCost(decimal? estimatedCost, decimal? actualCost = null)
    {
        EstimatedCost = estimatedCost;
        if (actualCost.HasValue) ActualCost = actualCost;
        UpdateTimestamp();
    }

    public void SetDisplayOrder(int order)
    {
        DisplayOrder = order;
        UpdateTimestamp();
    }

    public void UpdateWbsCode(WorkBreakdownStructure wbsCode)
    {
        WbsCode = wbsCode;
        UpdateTimestamp();
    }

    public void ChangeParent(Guid? parentTaskId)
    {
        // Prevent circular reference: a task cannot be its own parent
        if (parentTaskId.HasValue && parentTaskId.Value == Id)
        {
            throw new InvalidOperationException("A task cannot be its own parent.");
        }

        ParentTaskId = parentTaskId;
        UpdateTimestamp();
    }

    public void LinkToJira(string issueKey, string? issueId = null)
    {
        JiraIssueKey = issueKey;
        JiraIssueId = issueId;
        UpdateTimestamp();
    }

    public void UnlinkFromJira()
    {
        JiraIssueKey = null;
        JiraIssueId = null;
        UpdateTimestamp();
    }
}

public enum TaskType
{
    Task = 0,
    Milestone = 1,
    Summary = 2
}

public enum TaskStatus
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2,
    OnHold = 3,
    Cancelled = 4
}

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum TaskConstraint
{
    AsSoonAsPossible = 0,
    AsLateAsPossible = 1,
    MustStartOn = 2,
    MustFinishOn = 3,
    StartNoEarlierThan = 4,
    StartNoLaterThan = 5,
    FinishNoEarlierThan = 6,
    FinishNoLaterThan = 7
}

