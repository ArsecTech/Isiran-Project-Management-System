using AutoMapper;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Projects.Queries;

public class GetProjectQueryHandler : IRequestHandler<GetProjectQuery, GetProjectDto?>
{
    private readonly IRepository<Domain.Projects.Project> _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetProjectQueryHandler> _logger;

    public GetProjectQueryHandler(
        IRepository<Domain.Projects.Project> repository,
        IMapper mapper,
        ILogger<GetProjectQueryHandler> logger)
    {
        _repository = repository;
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

        var dto = _mapper.Map<GetProjectDto>(project);
        
        // Calculate progress
        if (project.Tasks != null && project.Tasks.Any())
        {
            dto.TaskCount = project.Tasks.Count;
            dto.CompletedTaskCount = project.Tasks.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed);
            dto.ProgressPercentage = dto.TaskCount > 0 
                ? (double)dto.CompletedTaskCount / dto.TaskCount * 100 
                : 0;
        }

        return dto;
    }
}

