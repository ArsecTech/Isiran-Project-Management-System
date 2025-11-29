using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Isiran.Application.Organizations.Queries;

public class GetOrganizationListQueryHandler : IRequestHandler<GetOrganizationListQuery, PagedResult<GetOrganizationDto>>
{
    private readonly IRepository<Domain.Organizations.Organization> _organizationRepository;
    private readonly IRepository<Domain.Resources.Resource> _resourceRepository;
    private readonly IRepository<Domain.Projects.Project> _projectRepository;
    private readonly IUnitOfWork _unitOfWork;

    public GetOrganizationListQueryHandler(
        IRepository<Domain.Organizations.Organization> organizationRepository,
        IRepository<Domain.Resources.Resource> resourceRepository,
        IRepository<Domain.Projects.Project> projectRepository,
        IUnitOfWork unitOfWork)
    {
        _organizationRepository = organizationRepository;
        _resourceRepository = resourceRepository;
        _projectRepository = projectRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PagedResult<GetOrganizationDto>> Handle(GetOrganizationListQuery request, CancellationToken cancellationToken)
    {
        var query = _organizationRepository
            .GetQueryable()
            .Where(o => !o.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchTerm))
        {
            query = query.Where(o => 
                o.Name.Contains(request.SearchTerm) ||
                (o.Code != null && o.Code.Contains(request.SearchTerm)) ||
                (o.Description != null && o.Description.Contains(request.SearchTerm)));
        }

        if (request.ParentOrganizationId.HasValue)
        {
            query = query.Where(o => o.ParentOrganizationId == request.ParentOrganizationId.Value);
        }
        else if (request.ParentOrganizationId == null && request.SearchTerm == null)
        {
            // If no parent specified and no search, show only root organizations by default
            query = query.Where(o => o.ParentOrganizationId == null);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(o => o.IsActive == request.IsActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var organizations = await query
            .Include(o => o.ParentOrganization)
            .Include(o => o.SubOrganizations)
            .OrderBy(o => o.Name)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(o => new GetOrganizationDto
            {
                Id = o.Id,
                Name = o.Name,
                Code = o.Code,
                Description = o.Description,
                ParentOrganizationId = o.ParentOrganizationId,
                ParentOrganizationName = o.ParentOrganization != null ? o.ParentOrganization.Name : null,
                Level = o.Level,
                ManagerId = o.ManagerId,
                IsActive = o.IsActive,
                ResourcesCount = 0, // Will be calculated
                ProjectsCount = 0, // Will be calculated
                SubOrganizationsCount = o.SubOrganizations.Count(so => !so.IsDeleted),
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        // Calculate actual counts
        foreach (var org in organizations)
        {
            org.ResourcesCount = await _resourceRepository
                .GetQueryable()
                .CountAsync(r => r.OrganizationId == org.Id && !r.IsDeleted, cancellationToken);

            org.ProjectsCount = await _projectRepository
                .GetQueryable()
                .CountAsync(p => p.OrganizationId == org.Id && !p.IsDeleted, cancellationToken);
        }

        return new PagedResult<GetOrganizationDto>(
            organizations,
            totalCount,
            request.PageNumber,
            request.PageSize);
    }
}

