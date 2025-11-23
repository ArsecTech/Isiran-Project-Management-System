using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Resources.Commands;

public class UpdateResourceCommandHandler : IRequestHandler<UpdateResourceCommand, Unit>
{
    private readonly IRepository<Domain.Resources.Resource> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateResourceCommandHandler> _logger;

    public UpdateResourceCommandHandler(
        IRepository<Domain.Resources.Resource> repository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateResourceCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateResourceCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating resource: {ResourceId}", request.Id);

        var resource = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (resource == null || resource.IsDeleted)
        {
            throw new NotFoundException($"Resource with ID {request.Id} not found.");
        }

        resource.UpdateDetails(
            firstName: request.FirstName,
            lastName: request.LastName,
            email: request.Email,
            phoneNumber: request.PhoneNumber,
            department: request.Department,
            jobTitle: request.JobTitle);

        if (request.Type.HasValue)
        {
            // Note: Type is not directly updatable in the domain model
            // This would require a domain method if needed
        }

        if (request.Status.HasValue)
        {
            resource.ChangeStatus(request.Status.Value);
        }

        if (request.StandardRate.HasValue)
        {
            resource.UpdateRates(
                request.StandardRate.Value,
                request.OvertimeRate);
        }

        if (request.MaxUnits.HasValue)
        {
            resource.UpdateMaxUnits(request.MaxUnits.Value);
        }

        if (request.ManagerId.HasValue)
        {
            resource.AssignManager(request.ManagerId.Value);
        }

        await _repository.UpdateAsync(resource, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resource updated: {ResourceId}", request.Id);

        return Unit.Value;
    }
}

