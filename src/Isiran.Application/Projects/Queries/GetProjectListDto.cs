namespace Isiran.Application.Projects.Queries;

public class GetProjectListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Domain.Projects.ProjectStatus Status { get; set; }
    public Domain.Projects.ProjectPriority Priority { get; set; }
    public Domain.Projects.ProjectNature Nature { get; set; }
    public string? Center { get; set; }
    public Guid? ProjectManagerId { get; set; }
    public string? ProjectManagerName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public double ProgressPercentage { get; set; } // پیشرفت برنامه‌ای
    public int? SelfReportedProgress { get; set; } // پیشرفت خوداظهاری
    public int? ApprovedProgress { get; set; } // پیشرفت تایید شده
    public DateTime? LastUpdatedByExecutor { get; set; }
    public DateTime? LastApprovedByClient { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

