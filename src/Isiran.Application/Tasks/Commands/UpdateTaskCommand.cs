using MediatR;

namespace Isiran.Application.Tasks.Commands;

public class UpdateTaskCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Tasks.TaskPriority? Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public int? Duration { get; set; }
    public Guid? AssignedToId { get; set; }
}

