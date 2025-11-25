using Isiran.Domain.Tasks;
using MediatR;

namespace Isiran.Application.Tasks.Queries
{
    public class GetActivityDependenciesQuery : IRequest<List<ActivityDependencyDto>>
    {
        public Guid? ProjectId { get; set; }
        public Guid? TaskId { get; set; }
    }

    public class ActivityDependencyDto
    {
        public Guid Id { get; set; }
        public Guid PredecessorActivityId { get; set; }
        public string PredecessorName { get; set; } = string.Empty;
        public Guid SuccessorActivityId { get; set; }
        public string SuccessorName { get; set; } = string.Empty;
        public DependencyType DependencyType { get; set; }
        public int Lag { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

