using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Tasks.Commands;

public class MoveTaskCommandHandler : IRequestHandler<MoveTaskCommand, Unit>
{
    private readonly IRepository<Domain.Tasks.ProjectTask> _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<MoveTaskCommandHandler> _logger;

    public MoveTaskCommandHandler(
        IRepository<Domain.Tasks.ProjectTask> repository,
        IUnitOfWork unitOfWork,
        ILogger<MoveTaskCommandHandler> logger)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(MoveTaskCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Moving task: {TaskId} to parent: {ParentId}, order: {Order}", 
            request.TaskId, request.NewParentTaskId, request.NewDisplayOrder);

        var task = await _repository.GetByIdAsync(request.TaskId, cancellationToken);
        if (task == null)
        {
            throw new NotFoundException($"Task with ID {request.TaskId} not found.");
        }

        // TODO: Validate parent task exists and is in same project
        // TODO: Update WBS codes for all affected tasks

        task.SetDisplayOrder(request.NewDisplayOrder);
        // Note: ParentTaskId is a private setter, would need to add a method to ProjectTask to change parent

        await _repository.UpdateAsync(task, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}

