using AutoMapper;
using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Projects.Queries;

public class GetProjectListQueryHandler : IRequestHandler<GetProjectListQuery, PagedResult<GetProjectListDto>>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetProjectListQueryHandler> _logger;

    public GetProjectListQueryHandler(
        IRepository<Domain.Projects.Project> repository,
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IMapper mapper,
        ILogger<GetProjectListQueryHandler> logger)
    {
        _repository = repository;
        _taskRepository = taskRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<GetProjectListDto>> Handle(GetProjectListQuery request, CancellationToken cancellationToken)
    {
        var projects = await _repository.FindAsync(p => 
            !p.IsDeleted &&
            (string.IsNullOrEmpty(request.SearchTerm) || 
             p.Name.Contains(request.SearchTerm) || 
             p.Code.Contains(request.SearchTerm)) &&
            (!request.Status.HasValue || p.Status == request.Status.Value) &&
            (!request.Priority.HasValue || p.Priority == request.Priority.Value),
            cancellationToken);

        var totalCount = projects.Count();
        var pagedProjects = projects
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = _mapper.Map<List<GetProjectListDto>>(pagedProjects);

        // Calculate progress for each project by loading tasks separately using repository
        var projectIds = pagedProjects.Select(p => p.Id).ToList();
        var allTasks = await _taskRepository.FindAsync(
            t => projectIds.Contains(t.ProjectId) && !t.IsDeleted, 
            cancellationToken);
        var taskList = allTasks.ToList();

        foreach (var dto in dtos)
        {
            var projectTasks = taskList.Where(t => t.ProjectId == dto.Id).ToList();
            if (projectTasks.Any())
            {
                var completedCount = projectTasks.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed);
                dto.TaskCount = projectTasks.Count;
                dto.CompletedTaskCount = completedCount;
                dto.ProgressPercentage = (double)completedCount / projectTasks.Count * 100;
            }
            else
            {
                dto.TaskCount = 0;
                dto.CompletedTaskCount = 0;
                dto.ProgressPercentage = 0;
            }
        }

        return new PagedResult<GetProjectListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

