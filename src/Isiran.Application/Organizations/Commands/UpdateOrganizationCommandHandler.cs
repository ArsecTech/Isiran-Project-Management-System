using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;

namespace Isiran.Application.Organizations.Commands;

public class UpdateOrganizationCommandHandler : IRequestHandler<UpdateOrganizationCommand>
{
    private readonly IRepository<Domain.Organizations.Organization> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateOrganizationCommandHandler(
        IRepository<Domain.Organizations.Organization> repository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateOrganizationCommand request, CancellationToken cancellationToken)
    {
        var organization = await _repository
            .GetByIdAsync(request.Id, cancellationToken);

        if (organization == null || organization.IsDeleted)
        {
            throw new NotFoundException($"Organization with ID {request.Id} not found.");
        }

        organization.UpdateDetails(
            request.Name,
            request.Description,
            request.Code,
            request.ManagerId);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

