using MediatR;

namespace Isiran.Application.Reporting.Queries;

public class GetProjectReportQuery : IRequest<ProjectReportDto>
{
    public Guid ProjectId { get; set; }
    public ReportType Type { get; set; } = ReportType.Summary;
}

public enum ReportType
{
    Summary = 0,
    Detailed = 1,
    Resource = 2,
    Cost = 3
}

public class ProjectReportDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public ReportType Type { get; set; }
    public DateTime GeneratedAt { get; set; }
    public ProjectSummaryDto Summary { get; set; } = null!;
    public List<TaskReportDto> Tasks { get; set; } = new();
    public List<ResourceReportDto> Resources { get; set; } = new();
    public CostReportDto Cost { get; set; } = null!;
}

public class ProjectSummaryDto
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public DateTime? ActualStartDate { get; set; }
    public DateTime? ActualEndDate { get; set; }
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public double ProgressPercentage { get; set; }
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public decimal RemainingBudget { get; set; }
}

public class TaskReportDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public int? PercentComplete { get; set; }
    public string? AssignedTo { get; set; }
}

public class ResourceReportDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TotalHours { get; set; }
    public decimal BillableHours { get; set; }
    public decimal Cost { get; set; }
}

public class CostReportDto
{
    public decimal TotalBudget { get; set; }
    public decimal TotalActual { get; set; }
    public decimal TotalEstimated { get; set; }
    public decimal Variance { get; set; }
    public List<CostCategoryDto> Categories { get; set; } = new();
}

public class CostCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Budgeted { get; set; }
    public decimal Actual { get; set; }
    public decimal Variance { get; set; }
}

