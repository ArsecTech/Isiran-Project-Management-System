using AutoMapper;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Queries;

public class GetTaskQueryHandler : IRequestHandler<GetTaskQuery, GetTaskDto?>
{
    private readonly IRepository<Domain.Tasks.ProjectTask> _repository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetTaskQueryHandler> _logger;

    public GetTaskQueryHandler(
        IRepository<Domain.Tasks.ProjectTask> repository,
        IMapper mapper,
        ILogger<GetTaskQueryHandler> logger)
    {
        _repository = repository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<GetTaskDto?> Handle(GetTaskQuery request, CancellationToken cancellationToken)
    {
        var task = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (task == null)
        {
            return null;
        }

        var dto = _mapper.Map<GetTaskDto>(task);
        
        if (task.AssignedTo != null)
        {
            dto.AssignedToName = task.AssignedTo.FullName;
        }

        if (task.Dependencies != null)
        {
            dto.Dependencies = task.Dependencies.Select(d => new GetTaskDependencyDto
            {
                Id = d.Id,
                PredecessorTaskId = d.PredecessorTaskId,
                SuccessorTaskId = d.SuccessorTaskId,
                Type = d.Type,
                Lag = d.Lag
            }).ToList();
        }

        return dto;
    }
}

