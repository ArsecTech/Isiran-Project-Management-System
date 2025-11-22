using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Commands;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, Guid>
{
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IRepository<Domain.Projects.Project> _projectRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateTaskCommandHandler> _logger;

    public CreateTaskCommandHandler(
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IRepository<Domain.Projects.Project> projectRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateTaskCommandHandler> logger)
    {
        _taskRepository = taskRepository;
        _projectRepository = projectRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateTaskCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating task: {TaskName} for project: {ProjectId}", request.Name, request.ProjectId);

        // Verify project exists
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project with ID {request.ProjectId} not found.");
        }

        var task = new Domain.Tasks.ProjectTask(
            request.ProjectId,
            request.Name,
            request.Type,
            request.ParentTaskId,
            request.StartDate,
            request.Duration,
            request.Priority,
            request.Description);

        if (request.AssignedToId.HasValue)
        {
            task.AssignTo(request.AssignedToId.Value);
        }

        await _taskRepository.AddAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Task created with ID: {TaskId}", task.Id);

        return task.Id;
    }
}

