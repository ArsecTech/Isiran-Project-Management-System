namespace Isiran.Application.Projects.Queries;

public class GetProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Projects.ProjectStatus Status { get; set; }
    public Domain.Projects.ProjectPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public Domain.Projects.ProjectNature Nature { get; set; }
    public string? Center { get; set; }
    public Guid? ProjectManagerId { get; set; }
    public string? ProjectManagerName { get; set; }
    public Guid? OwnerId { get; set; }
    public string? OwnerName { get; set; }
    public double ProgressPercentage { get; set; } // پیشرفت برنامه‌ای
    public int? SelfReportedProgress { get; set; } // پیشرفت خوداظهاری
    public int? ApprovedProgress { get; set; } // پیشرفت تایید شده
    public DateTime? LastUpdatedByExecutor { get; set; }
    public DateTime? LastApprovedByClient { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
}

