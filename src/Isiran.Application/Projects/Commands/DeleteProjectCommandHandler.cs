using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Projects.Commands;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand, Unit>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<DeleteProjectCommandHandler> _logger;

    public DeleteProjectCommandHandler(
        IRepository<Domain.Projects.Project> repository,
        IUnitOfWork unitOfWork,
        ILogger<DeleteProjectCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(DeleteProjectCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Deleting project: {ProjectId}", request.Id);

        var project = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project with ID {request.Id} not found.");
        }

        project.MarkAsDeleted();
        await _repository.UpdateAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Project deleted: {ProjectId}", request.Id);

        return Unit.Value;
    }
}

