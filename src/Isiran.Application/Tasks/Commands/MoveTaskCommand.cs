using MediatR;

namespace Isiran.Application.Tasks.Commands;

public class MoveTaskCommand : IRequest<Unit>
{
    public Guid TaskId { get; set; }
    public Guid? NewParentTaskId { get; set; }
    public int NewDisplayOrder { get; set; }
}

