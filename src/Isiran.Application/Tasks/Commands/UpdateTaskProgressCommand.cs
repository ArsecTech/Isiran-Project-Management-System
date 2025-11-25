using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Commands;

public class UpdateTaskProgressCommand : IRequest<Unit>
{
    public Guid TaskId { get; set; }
    public int? SelfReportedProgress { get; set; }
    public int? ApprovedProgress { get; set; }
}

public class UpdateTaskProgressCommandHandler : IRequestHandler<UpdateTaskProgressCommand, Unit>
{
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateTaskProgressCommandHandler> _logger;

    public UpdateTaskProgressCommandHandler(
        IRepository<ProjectTask> taskRepository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateTaskProgressCommandHandler> logger)
    {
        _taskRepository = taskRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateTaskProgressCommand request, CancellationToken cancellationToken)
    {
        var task = await _taskRepository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {request.TaskId} was not found.");
        }

        if (request.SelfReportedProgress.HasValue)
        {
            task.UpdateSelfReportedProgress(request.SelfReportedProgress);
        }

        if (request.ApprovedProgress.HasValue)
        {
            task.UpdateApprovedProgress(request.ApprovedProgress);
        }

        await _taskRepository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Updated progress for task {TaskId}", task.Id);

        return Unit.Value;
    }
}

