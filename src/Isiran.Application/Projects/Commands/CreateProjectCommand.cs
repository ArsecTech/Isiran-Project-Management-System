using MediatR;

namespace Isiran.Application.Projects.Commands;

public class CreateProjectCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Domain.Projects.ProjectPriority Priority { get; set; } = Domain.Projects.ProjectPriority.Medium;
    public Domain.Projects.ProjectNature Nature { get; set; } = Domain.Projects.ProjectNature.DesignAndImplementation;
    public string? Center { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal Budget { get; set; }
    public Guid? ProjectManagerId { get; set; }
    public Guid? OwnerId { get; set; }
    public string? JiraProjectKey { get; set; } // برای ایجاد از Jira
}

