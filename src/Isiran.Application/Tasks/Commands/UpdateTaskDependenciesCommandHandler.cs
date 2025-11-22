using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Tasks.Commands;

public class UpdateTaskDependenciesCommandHandler : IRequestHandler<UpdateTaskDependenciesCommand, Unit>
{
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IRepository<Domain.Tasks.TaskDependency> _dependencyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateTaskDependenciesCommandHandler> _logger;

    public UpdateTaskDependenciesCommandHandler(
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IRepository<Domain.Tasks.TaskDependency> dependencyRepository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateTaskDependenciesCommandHandler> logger)
    {
        _taskRepository = taskRepository;
        _dependencyRepository = dependencyRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateTaskDependenciesCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating dependencies for task: {TaskId}", request.TaskId);

        var task = await _taskRepository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {request.TaskId} not found.");
        }

        // Remove existing dependencies
        var existingDependencies = await _dependencyRepository.FindAsync(
            d => d.SuccessorTaskId == request.TaskId || d.PredecessorTaskId == request.TaskId,
            cancellationToken);

        foreach (var dep in existingDependencies)
        {
            await _dependencyRepository.DeleteAsync(dep, cancellationToken);
        }

        // Add new dependencies
        foreach (var depDto in request.Dependencies)
        {
            var dependency = new Domain.Tasks.TaskDependency(
                depDto.PredecessorTaskId,
                depDto.SuccessorTaskId,
                depDto.Type,
                depDto.Lag);

            await _dependencyRepository.AddAsync(dependency, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Dependencies updated for task: {TaskId}", request.TaskId);

        return Unit.Value;
    }
}

