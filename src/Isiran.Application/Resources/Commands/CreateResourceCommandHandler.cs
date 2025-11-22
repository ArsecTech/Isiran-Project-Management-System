using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Resources.Commands;

public class CreateResourceCommandHandler : IRequestHandler<CreateResourceCommand, Guid>
{
    private readonly IRepository<Domain.Resources.Resource> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateResourceCommandHandler> _logger;

    public CreateResourceCommandHandler(
        IRepository<Domain.Resources.Resource> repository,
        IUnitOfWork unitOfWork,
        ILogger<CreateResourceCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateResourceCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating resource: {FirstName} {LastName}", request.FirstName, request.LastName);

        var resource = new Domain.Resources.Resource(
            request.FirstName,
            request.LastName,
            request.Email,
            request.Type,
            request.StandardRate,
            request.MaxUnits);

        resource.UpdateDetails(
            firstName: request.FirstName,
            lastName: request.LastName,
            email: request.Email,
            phoneNumber: request.PhoneNumber,
            department: request.Department,
            jobTitle: request.JobTitle);

        await _repository.AddAsync(resource, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resource created with ID: {ResourceId}", resource.Id);

        return resource.Id;
    }
}

