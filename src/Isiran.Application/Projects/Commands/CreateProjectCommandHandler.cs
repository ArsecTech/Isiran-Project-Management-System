using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Projects.Commands;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, Guid>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateProjectCommandHandler> _logger;

    public CreateProjectCommandHandler(
        IRepository<Domain.Projects.Project> repository,
        IUnitOfWork unitOfWork,
        ILogger<CreateProjectCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateProjectCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating project: {ProjectName}", request.Name);

        var project = new Domain.Projects.Project(
            request.Name,
            request.Code,
            request.ProjectManagerId,
            request.OwnerId,
            request.Description,
            request.Priority,
            request.StartDate,
            request.EndDate,
            request.Budget);

        await _repository.AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Project created with ID: {ProjectId}", project.Id);

        return project.Id;
    }
}

