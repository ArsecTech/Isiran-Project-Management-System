using Isiran.Domain.Common;

namespace Isiran.Domain.Tasks
{
    public class ActivityDependency : BaseEntity
    {
        public Guid PredecessorActivityId { get; set; }
        public Guid SuccessorActivityId { get; set; }
        public DependencyType DependencyType { get; set; } = DependencyType.FinishToStart;
        public int Lag { get; set; } = 0; // Lag in days

        public void Validate()
        {
            if (PredecessorActivityId == SuccessorActivityId)
            {
                throw new InvalidOperationException("A task cannot depend on itself.");
            }
        }
    }
}

