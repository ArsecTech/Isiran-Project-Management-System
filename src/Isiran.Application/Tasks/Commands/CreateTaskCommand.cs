using MediatR;

namespace Isiran.Application.Tasks.Commands;

public class CreateTaskCommand : IRequest<Guid>
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Tasks.TaskType Type { get; set; } = Domain.Tasks.TaskType.Task;
    public Domain.Tasks.TaskPriority Priority { get; set; } = Domain.Tasks.TaskPriority.Medium;
    public Guid? ParentTaskId { get; set; }
    public DateTime? StartDate { get; set; }
    public int? Duration { get; set; }
    public Guid? AssignedToId { get; set; }
}

