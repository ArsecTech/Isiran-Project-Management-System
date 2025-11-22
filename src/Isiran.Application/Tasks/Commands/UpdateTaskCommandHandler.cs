using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Tasks.Commands;

public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, Unit>
{
    private readonly IRepository<Domain.Tasks.ProjectTask> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateTaskCommandHandler> _logger;

    public UpdateTaskCommandHandler(
        IRepository<Domain.Tasks.ProjectTask> repository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateTaskCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateTaskCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating task: {TaskId}", request.Id);

        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {request.Id} not found.");
        }

        task.UpdateDetails(
            request.Name,
            request.Description,
            request.Priority,
            request.StartDate,
            request.Duration);

        if (request.AssignedToId.HasValue)
        {
            task.AssignTo(request.AssignedToId.Value);
        }

        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Task updated: {TaskId}", request.Id);

        return Unit.Value;
    }
}

