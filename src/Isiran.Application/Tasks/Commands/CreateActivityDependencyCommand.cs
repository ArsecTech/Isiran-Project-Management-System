using Isiran.Domain.Tasks;
using MediatR;

namespace Isiran.Application.Tasks.Commands
{
    public class CreateActivityDependencyCommand : IRequest<Guid>
    {
        public Guid PredecessorActivityId { get; set; }
        public Guid SuccessorActivityId { get; set; }
        public DependencyType DependencyType { get; set; } = DependencyType.FinishToStart;
        public int Lag { get; set; } = 0;
    }
}

