using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Commands
{
    public class CreateActivityDependencyCommandHandler : IRequestHandler<CreateActivityDependencyCommand, Guid>
    {
        private readonly IRepository<ActivityDependency> _dependencyRepository;
        private readonly IRepository<ProjectTask> _taskRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CreateActivityDependencyCommandHandler> _logger;

        public CreateActivityDependencyCommandHandler(
            IRepository<ActivityDependency> dependencyRepository,
            IRepository<ProjectTask> taskRepository,
            IUnitOfWork unitOfWork,
            ILogger<CreateActivityDependencyCommandHandler> logger)
        {
            _dependencyRepository = dependencyRepository;
            _taskRepository = taskRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Guid> Handle(CreateActivityDependencyCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Creating activity dependency: {PredecessorId} -> {SuccessorId}", 
                request.PredecessorActivityId, request.SuccessorActivityId);

            // Validate tasks exist
            var predecessor = await _taskRepository.GetByIdAsync(request.PredecessorActivityId, cancellationToken);
            if (predecessor == null)
                throw new InvalidOperationException($"Predecessor task {request.PredecessorActivityId} not found");

            var successor = await _taskRepository.GetByIdAsync(request.SuccessorActivityId, cancellationToken);
            if (successor == null)
                throw new InvalidOperationException($"Successor task {request.SuccessorActivityId} not found");

            // Check if tasks are in the same project
            if (predecessor.ProjectId != successor.ProjectId)
                throw new InvalidOperationException("Tasks must be in the same project");

            // Check for circular dependencies
            await ValidateNoCircularDependency(request.PredecessorActivityId, request.SuccessorActivityId, cancellationToken);

            var dependency = new ActivityDependency
            {
                PredecessorActivityId = request.PredecessorActivityId,
                SuccessorActivityId = request.SuccessorActivityId,
                DependencyType = request.DependencyType,
                Lag = request.Lag
            };

            dependency.Validate();

            await _dependencyRepository.AddAsync(dependency, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activity dependency created: {Id}", dependency.Id);
            return dependency.Id;
        }

        private async Task ValidateNoCircularDependency(Guid predecessorId, Guid successorId, CancellationToken cancellationToken)
        {
            // Check if adding this dependency would create a cycle
            var visited = new HashSet<Guid>();
            var stack = new Stack<Guid>();
            stack.Push(successorId);

            while (stack.Count > 0)
            {
                var current = stack.Pop();
                if (current == predecessorId)
                    throw new InvalidOperationException("Circular dependency detected");

                if (visited.Contains(current))
                    continue;

                visited.Add(current);

                // Get all tasks that depend on current task
                var dependencies = await _dependencyRepository.FindAsync(
                    d => d.PredecessorActivityId == current,
                    cancellationToken);

                foreach (var dep in dependencies)
                {
                    stack.Push(dep.SuccessorActivityId);
                }
            }
        }
    }
}

