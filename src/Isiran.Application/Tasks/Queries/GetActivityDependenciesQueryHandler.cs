using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Queries
{
    public class GetActivityDependenciesQueryHandler : IRequestHandler<GetActivityDependenciesQuery, List<ActivityDependencyDto>>
    {
        private readonly IRepository<ActivityDependency> _dependencyRepository;
        private readonly IRepository<ProjectTask> _taskRepository;
        private readonly ILogger<GetActivityDependenciesQueryHandler> _logger;

        public GetActivityDependenciesQueryHandler(
            IRepository<ActivityDependency> dependencyRepository,
            IRepository<ProjectTask> taskRepository,
            ILogger<GetActivityDependenciesQueryHandler> logger)
        {
            _dependencyRepository = dependencyRepository;
            _taskRepository = taskRepository;
            _logger = logger;
        }

        public async Task<List<ActivityDependencyDto>> Handle(GetActivityDependenciesQuery request, CancellationToken cancellationToken)
        {
            var dependencies = await _dependencyRepository.FindAsync(
                d => (!request.ProjectId.HasValue || 
                      (d.PredecessorActivityId != null && d.SuccessorActivityId != null)) &&
                     (!request.TaskId.HasValue || 
                      d.PredecessorActivityId == request.TaskId.Value || 
                      d.SuccessorActivityId == request.TaskId.Value),
                cancellationToken);

            var taskIds = dependencies
                .Select(d => d.PredecessorActivityId)
                .Union(dependencies.Select(d => d.SuccessorActivityId))
                .Distinct()
                .ToList();

            var tasks = await _taskRepository.FindAsync(
                t => taskIds.Contains(t.Id),
                cancellationToken);

            var taskMap = tasks.ToDictionary(t => t.Id, t => t.Name);

            return dependencies.Select(d => new ActivityDependencyDto
            {
                Id = d.Id,
                PredecessorActivityId = d.PredecessorActivityId,
                PredecessorName = taskMap.GetValueOrDefault(d.PredecessorActivityId, "Unknown"),
                SuccessorActivityId = d.SuccessorActivityId,
                SuccessorName = taskMap.GetValueOrDefault(d.SuccessorActivityId, "Unknown"),
                DependencyType = d.DependencyType,
                Lag = d.Lag,
                CreatedAt = d.CreatedAt
            }).ToList();
        }
    }
}

