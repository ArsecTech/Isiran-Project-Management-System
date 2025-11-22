using Isiran.Domain.Common;

namespace Isiran.Domain.Tasks;

public class TaskDependency : BaseEntity
{
    public Guid PredecessorTaskId { get; private set; }
    public Guid SuccessorTaskId { get; private set; }
    public DependencyType Type { get; private set; }
    public int Lag { get; private set; } // in days

    // Navigation properties
    public virtual ProjectTask PredecessorTask { get; private set; } = null!;
    public virtual ProjectTask SuccessorTask { get; private set; } = null!;

    private TaskDependency() { }

    public TaskDependency(
        Guid predecessorTaskId,
        Guid successorTaskId,
        DependencyType type,
        int lag = 0)
    {
        PredecessorTaskId = predecessorTaskId;
        SuccessorTaskId = successorTaskId;
        Type = type;
        Lag = lag;
    }

    public void UpdateDependency(DependencyType type, int lag = 0)
    {
        Type = type;
        Lag = lag;
        UpdateTimestamp();
    }
}

public enum DependencyType
{
    FinishToStart = 0,  // FS
    StartToStart = 1,   // SS
    FinishToFinish = 2, // FF
    StartToFinish = 3   // SF
}

