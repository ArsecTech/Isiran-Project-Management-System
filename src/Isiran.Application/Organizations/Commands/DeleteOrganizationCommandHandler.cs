using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Isiran.Application.Organizations.Commands;

public class DeleteOrganizationCommandHandler : IRequestHandler<DeleteOrganizationCommand>
{
    private readonly IRepository<Domain.Organizations.Organization> _organizationRepository;
    private readonly IRepository<Domain.Resources.Resource> _resourceRepository;
    private readonly IRepository<Domain.Projects.Project> _projectRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteOrganizationCommandHandler(
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

    public async Task Handle(DeleteOrganizationCommand request, CancellationToken cancellationToken)
    {
        var organization = await _organizationRepository
            .GetByIdAsync(request.Id, cancellationToken);

        if (organization == null || organization.IsDeleted)
        {
            throw new NotFoundException($"Organization with ID {request.Id} not found.");
        }

        // Check if organization has sub-organizations
        var hasSubOrgs = await _organizationRepository
            .GetQueryable()
            .AnyAsync(o => o.ParentOrganizationId == request.Id && !o.IsDeleted, cancellationToken);

        if (hasSubOrgs)
        {
            throw new ValidationException("Cannot delete organization with sub-organizations. Please delete or reassign sub-organizations first.");
        }

        // Check if organization has resources
        var hasResources = await _resourceRepository
            .GetQueryable()
            .AnyAsync(r => r.OrganizationId == request.Id && !r.IsDeleted, cancellationToken);

        if (hasResources)
        {
            throw new ValidationException("Cannot delete organization with assigned resources. Please reassign resources first.");
        }

        // Check if organization has projects
        var hasProjects = await _projectRepository
            .GetQueryable()
            .AnyAsync(p => p.OrganizationId == request.Id && !p.IsDeleted, cancellationToken);

        if (hasProjects)
        {
            throw new ValidationException("Cannot delete organization with assigned projects. Please reassign projects first.");
        }

        organization.MarkAsDeleted();
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

