using MediatR;

namespace Isiran.Application.Tasks.Commands
{
    public class DeleteActivityDependencyCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}

