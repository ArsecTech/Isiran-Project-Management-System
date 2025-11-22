namespace Isiran.Application.Tasks.Queries;

public class GetTaskDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Tasks.TaskType Type { get; set; }
    public Domain.Tasks.TaskStatus Status { get; set; }
    public Domain.Tasks.TaskPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int Duration { get; set; }
    public int ActualDuration { get; set; }
    public int? PercentComplete { get; set; }
    public Guid? ParentTaskId { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public int DisplayOrder { get; set; }
    public string WbsCode { get; set; } = string.Empty;
    public List<GetTaskDependencyDto> Dependencies { get; set; } = new();
}

public class GetTaskDependencyDto
{
    public Guid Id { get; set; }
    public Guid PredecessorTaskId { get; set; }
    public Guid SuccessorTaskId { get; set; }
    public Domain.Tasks.DependencyType Type { get; set; }
    public int Lag { get; set; }
}

