namespace Isiran.Application.Projects.Queries;

public class GetProjectListDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Domain.Projects.ProjectStatus Status { get; set; }
    public Domain.Projects.ProjectPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public double ProgressPercentage { get; set; }
    public int TaskCount { get; set; }
    public int CompletedTaskCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

