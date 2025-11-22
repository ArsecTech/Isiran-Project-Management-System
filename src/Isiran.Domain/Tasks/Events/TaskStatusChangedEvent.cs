using Isiran.Domain.Common;

namespace Isiran.Domain.Tasks;

public class TaskStatusChangedEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
    public Guid TaskId { get; }
    public Guid ProjectId { get; }
    public TaskStatus OldStatus { get; }
    public TaskStatus NewStatus { get; }

    public TaskStatusChangedEvent(Guid taskId, Guid projectId, TaskStatus oldStatus, TaskStatus newStatus)
    {
        TaskId = taskId;
        ProjectId = projectId;
        OldStatus = oldStatus;
        NewStatus = newStatus;
    }
}

