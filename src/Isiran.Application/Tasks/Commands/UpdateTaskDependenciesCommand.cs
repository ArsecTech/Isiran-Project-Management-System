using MediatR;

namespace Isiran.Application.Tasks.Commands;

public class UpdateTaskDependenciesCommand : IRequest<Unit>
{
    public Guid TaskId { get; set; }
    public List<CreateDependencyDto> Dependencies { get; set; } = new();
}

public class CreateDependencyDto
{
    public Guid PredecessorTaskId { get; set; }
    public Guid SuccessorTaskId { get; set; }
    public Domain.Tasks.DependencyType Type { get; set; }
    public int Lag { get; set; }
}

