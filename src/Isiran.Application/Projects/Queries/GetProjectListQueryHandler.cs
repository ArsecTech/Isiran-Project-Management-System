using AutoMapper;
using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Projects.Queries;

public class GetProjectListQueryHandler : IRequestHandler<GetProjectListQuery, PagedResult<GetProjectListDto>>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetProjectListQueryHandler> _logger;

    public GetProjectListQueryHandler(
        IRepository<Domain.Projects.Project> repository,
        IMapper mapper,
        ILogger<GetProjectListQueryHandler> logger)
    {
        _repository = repository;
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

        // Calculate progress for each project
        foreach (var dto in dtos)
        {
            var project = pagedProjects.First(p => p.Id == dto.Id);
            if (project.Tasks != null && project.Tasks.Any())
            {
                var completedCount = project.Tasks.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed);
                dto.ProgressPercentage = (double)completedCount / project.Tasks.Count * 100;
            }
        }

        return new PagedResult<GetProjectListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

