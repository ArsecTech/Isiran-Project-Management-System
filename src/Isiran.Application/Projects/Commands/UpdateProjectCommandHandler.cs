using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Projects.Commands;

public class UpdateProjectCommandHandler : IRequestHandler<UpdateProjectCommand, Unit>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateProjectCommandHandler> _logger;

    public UpdateProjectCommandHandler(
        IRepository<Domain.Projects.Project> repository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateProjectCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateProjectCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating project: {ProjectId}", request.Id);

        var project = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project with ID {request.Id} not found.");
        }

        project.UpdateDetails(
            request.Name,
            request.Description,
            request.Priority,
            request.StartDate,
            request.EndDate,
            request.Budget);

        await _repository.UpdateAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Project updated: {ProjectId}", request.Id);

        return Unit.Value;
    }
}

