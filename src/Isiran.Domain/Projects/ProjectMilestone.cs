using Isiran.Domain.Common;

namespace Isiran.Domain.Projects;

public class ProjectMilestone : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public DateTime TargetDate { get; private set; }
    public DateTime? ActualDate { get; private set; }
    public bool IsCompleted { get; private set; }

    // Navigation properties
    public virtual Project Project { get; private set; } = null!;

    private ProjectMilestone() { }

    public ProjectMilestone(
        Guid projectId,
        string name,
        DateTime targetDate,
        string? description = null)
    {
        ProjectId = projectId;
        Name = name;
        TargetDate = targetDate;
        Description = description;
        IsCompleted = false;
    }

    public void MarkAsCompleted(DateTime? actualDate = null)
    {
        IsCompleted = true;
        ActualDate = actualDate ?? DateTime.UtcNow;
        UpdateTimestamp();
    }

    public void UpdateTargetDate(DateTime targetDate)
    {
        TargetDate = targetDate;
        UpdateTimestamp();
    }
}

