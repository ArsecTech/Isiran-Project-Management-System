using Isiran.Domain.Common;

namespace Isiran.Domain.Projects;

public class ProjectStatusChangedEvent : IDomainEvent
{
    public Guid EventId { get; } = Guid.NewGuid();
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
    public Guid ProjectId { get; }
    public ProjectStatus OldStatus { get; }
    public ProjectStatus NewStatus { get; }

    public ProjectStatusChangedEvent(Guid projectId, ProjectStatus oldStatus, ProjectStatus newStatus)
    {
        ProjectId = projectId;
        OldStatus = oldStatus;
        NewStatus = newStatus;
    }
}

