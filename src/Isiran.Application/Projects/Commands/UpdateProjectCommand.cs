using MediatR;

namespace Isiran.Application.Projects.Commands;

public class UpdateProjectCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Projects.ProjectStatus? Status { get; set; }
    public Domain.Projects.ProjectPriority? Priority { get; set; }
    public Domain.Projects.ProjectNature? Nature { get; set; }
    public string? Center { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? Budget { get; set; }
    public Guid? ProjectManagerId { get; set; }
    public Guid? OwnerId { get; set; }
    public int? SelfReportedProgress { get; set; }
    public int? ApprovedProgress { get; set; }
}

