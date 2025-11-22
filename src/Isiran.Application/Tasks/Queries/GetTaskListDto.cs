namespace Isiran.Application.Tasks.Queries;

public class GetTaskListDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public Domain.Tasks.TaskStatus Status { get; set; }
    public Domain.Tasks.TaskPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? PercentComplete { get; set; }
    public Guid? AssignedToId { get; set; }
    public string? AssignedToName { get; set; }
    public string WbsCode { get; set; } = string.Empty;
}

