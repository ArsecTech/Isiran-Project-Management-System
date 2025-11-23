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

        // Update basic details
        var startDate = request.StartDate ?? task.StartDate;
        var duration = request.Duration;
        
        // If endDate is provided, calculate duration from startDate
        if (request.EndDate.HasValue && startDate.HasValue)
        {
            duration = (int)(request.EndDate.Value - startDate.Value).TotalDays + 1;
            if (duration <= 0) duration = 1;
        }
        
        task.UpdateDetails(
            request.Name,
            request.Description,
            request.Priority,
            startDate,
            duration);

        if (request.Status.HasValue)
        {
            task.ChangeStatus(request.Status.Value);
        }

        if (request.AssignedToId.HasValue)
        {
            task.AssignTo(request.AssignedToId.Value);
        }

        if (request.ParentTaskId != task.ParentTaskId)
        {
            task.ChangeParent(request.ParentTaskId);
        }

        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Task updated: {TaskId}", request.Id);

        return Unit.Value;
    }
}

