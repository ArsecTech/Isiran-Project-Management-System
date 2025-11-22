using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.TimeTracking.Commands;

public class CreateTimeEntryCommandHandler : IRequestHandler<CreateTimeEntryCommand, Guid>
{
    private readonly IRepository<Domain.Tasks.TaskTimeEntry> _timeEntryRepository;
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateTimeEntryCommandHandler> _logger;

    public CreateTimeEntryCommandHandler(
        IRepository<Domain.Tasks.TaskTimeEntry> timeEntryRepository,
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateTimeEntryCommandHandler> logger)
    {
        _timeEntryRepository = timeEntryRepository;
        _taskRepository = taskRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateTimeEntryCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating time entry for task: {TaskId}, resource: {ResourceId}", 
            request.TaskId, request.ResourceId);

        // Verify task exists
        var task = await _taskRepository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {request.TaskId} not found.");
        }

        var timeEntry = new Domain.Tasks.TaskTimeEntry(
            request.TaskId,
            request.ResourceId,
            request.Date,
            request.Hours,
            request.Description,
            request.IsBillable,
            request.HourlyRate);

        await _timeEntryRepository.AddAsync(timeEntry, cancellationToken);

        // Update task actual effort
        var currentActualEffort = task.ActualEffort ?? 0;
        task.UpdateEffort(task.EstimatedEffort, currentActualEffort + request.Hours);

        await _taskRepository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Time entry created with ID: {TimeEntryId}", timeEntry.Id);

        return timeEntry.Id;
    }
}

