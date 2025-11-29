using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Isiran.Application.Organizations.Queries;

public class GetOrganizationTreeQueryHandler : IRequestHandler<GetOrganizationTreeQuery, List<OrganizationTreeNodeDto>>
{
    private readonly IRepository<Domain.Organizations.Organization> _organizationRepository;
    private readonly IRepository<Domain.Resources.Resource> _resourceRepository;
    private readonly IRepository<Domain.Projects.Project> _projectRepository;

    public GetOrganizationTreeQueryHandler(
        IRepository<Domain.Organizations.Organization> organizationRepository,
        IRepository<Domain.Resources.Resource> resourceRepository,
        IRepository<Domain.Projects.Project> projectRepository)
    {
        _organizationRepository = organizationRepository;
        _resourceRepository = resourceRepository;
        _projectRepository = projectRepository;
    }

    public async Task<List<OrganizationTreeNodeDto>> Handle(GetOrganizationTreeQuery request, CancellationToken cancellationToken)
    {
        var allOrgs = await _organizationRepository
            .GetQueryable()
            .Include(o => o.ParentOrganization)
            .ToListAsync(cancellationToken);

        var orgDict = allOrgs.ToDictionary(o => o.Id, o => new OrganizationTreeNodeDto
        {
            Id = o.Id,
            Name = o.Name,
            Code = o.Code,
            Description = o.Description,
            ParentOrganizationId = o.ParentOrganizationId,
            Level = o.Level,
            ManagerId = o.ManagerId,
            IsActive = o.IsActive
        });

        // Build tree structure
        var rootNodes = new List<OrganizationTreeNodeDto>();

        foreach (var org in allOrgs)
        {
            var node = orgDict[org.Id];

            // Calculate counts
            node.ResourcesCount = await _resourceRepository
                .GetQueryable()
                .CountAsync(r => r.OrganizationId == org.Id && !r.IsDeleted, cancellationToken);

            node.ProjectsCount = await _projectRepository
                .GetQueryable()
                .CountAsync(p => p.OrganizationId == org.Id && !p.IsDeleted, cancellationToken);

            if (org.ParentOrganizationId.HasValue && orgDict.ContainsKey(org.ParentOrganizationId.Value))
            {
                orgDict[org.ParentOrganizationId.Value].Children.Add(node);
            }
            else
            {
                rootNodes.Add(node);
            }
        }

        return rootNodes;
    }
}

