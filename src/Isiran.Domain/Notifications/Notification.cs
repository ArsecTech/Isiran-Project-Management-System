using Isiran.Domain.Common;

namespace Isiran.Domain.Notifications;

public class Notification : BaseEntity
{
    public Guid UserId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public NotificationType Type { get; private set; }
    public NotificationPriority Priority { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public string? ActionUrl { get; private set; }
    public Guid? RelatedEntityId { get; private set; }
    public string? RelatedEntityType { get; private set; }

    // Navigation properties
    public virtual Users.User User { get; private set; } = null!;

    private Notification() { }

    public Notification(
        Guid userId,
        string title,
        string message,
        NotificationType type,
        NotificationPriority priority = NotificationPriority.Medium,
        string? actionUrl = null,
        Guid? relatedEntityId = null,
        string? relatedEntityType = null)
    {
        UserId = userId;
        Title = title;
        Message = message;
        Type = type;
        Priority = priority;
        IsRead = false;
        ActionUrl = actionUrl;
        RelatedEntityId = relatedEntityId;
        RelatedEntityType = relatedEntityType;
    }

    public void MarkAsRead()
    {
        IsRead = true;
        ReadAt = DateTime.UtcNow;
        UpdateTimestamp();
    }
}

public enum NotificationType
{
    Info = 0,
    Success = 1,
    Warning = 2,
    Error = 3,
    TaskAssigned = 4,
    TaskCompleted = 5,
    ProjectStatusChanged = 6,
    DeadlineApproaching = 7
}

public enum NotificationPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

