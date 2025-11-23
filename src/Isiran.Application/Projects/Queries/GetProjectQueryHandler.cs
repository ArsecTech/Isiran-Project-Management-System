using AutoMapper;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Projects.Queries;

public class GetProjectQueryHandler : IRequestHandler<GetProjectQuery, GetProjectDto?>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetProjectQueryHandler> _logger;

    public GetProjectQueryHandler(
        IRepository<Domain.Projects.Project> repository,
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IMapper mapper,
        ILogger<GetProjectQueryHandler> logger)
    {
        _repository = repository;
        _taskRepository = taskRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<GetProjectDto?> Handle(GetProjectQuery request, CancellationToken cancellationToken)
    {
        var project = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (project == null)
        {
            return null;
        }

        // Load tasks separately using repository
        var tasks = await _taskRepository.FindAsync(t => t.ProjectId == request.Id && !t.IsDeleted, cancellationToken);
        var taskList = tasks.ToList();

        var dto = _mapper.Map<GetProjectDto>(project);
        
        // Calculate progress using loaded tasks
        if (taskList.Any())
        {
            dto.TaskCount = taskList.Count;
            dto.CompletedTaskCount = taskList.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed);
            dto.ProgressPercentage = dto.TaskCount > 0 
                ? (double)dto.CompletedTaskCount / dto.TaskCount * 100 
                : 0;
        }
        else
        {
            dto.TaskCount = 0;
            dto.CompletedTaskCount = 0;
            dto.ProgressPercentage = 0;
        }

        return dto;
    }
}

