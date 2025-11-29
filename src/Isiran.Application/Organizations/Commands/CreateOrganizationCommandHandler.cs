using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Isiran.Application.Organizations.Commands;

public class CreateOrganizationCommandHandler : IRequestHandler<CreateOrganizationCommand, Guid>
{
    private readonly IRepository<Domain.Organizations.Organization> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateOrganizationCommandHandler(
        IRepository<Domain.Organizations.Organization> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Guid> Handle(CreateOrganizationCommand request, CancellationToken cancellationToken)
    {
        // Check if code is unique
        if (!string.IsNullOrEmpty(request.Code))
        {
            var existingOrg = await _repository
                .FirstOrDefaultAsync(o => o.Code == request.Code && !o.IsDeleted, cancellationToken);

            if (existingOrg != null)
            {
                throw new ValidationException($"Organization with code '{request.Code}' already exists.");
            }
        }

        // Validate parent organization if provided
        if (request.ParentOrganizationId.HasValue)
        {
            var parentOrg = await _repository
                .GetByIdAsync(request.ParentOrganizationId.Value, cancellationToken);

            if (parentOrg == null || parentOrg.IsDeleted)
            {
                throw new NotFoundException($"Parent organization with ID {request.ParentOrganizationId.Value} not found.");
            }
        }

        var organization = new Domain.Organizations.Organization(
            request.Name,
            request.Code,
            request.Description,
            request.ParentOrganizationId,
            request.ManagerId);

        // Calculate level based on parent
        if (request.ParentOrganizationId.HasValue)
        {
            var parentOrg = await _repository
                .GetByIdAsync(request.ParentOrganizationId.Value, cancellationToken);
            if (parentOrg != null)
            {
                organization.SetLevel(parentOrg.Level + 1);
            }
        }

        await _repository.AddAsync(organization, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return organization.Id;
    }
}

