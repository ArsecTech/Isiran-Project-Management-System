using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Resources.Commands;

public class DeleteResourceCommandHandler : IRequestHandler<DeleteResourceCommand, Unit>
{
    private readonly IRepository<Domain.Resources.Resource> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteResourceCommandHandler> _logger;

    public DeleteResourceCommandHandler(
        IRepository<Domain.Resources.Resource> repository,
        IUnitOfWork unitOfWork,
        ILogger<DeleteResourceCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteResourceCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting resource: {ResourceId}", request.Id);

        var resource = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (resource == null || resource.IsDeleted)
        {
            throw new NotFoundException($"Resource with ID {request.Id} not found.");
        }

        resource.MarkAsDeleted();
        await _repository.UpdateAsync(resource, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Resource deleted: {ResourceId}", request.Id);

        return Unit.Value;
    }
}

