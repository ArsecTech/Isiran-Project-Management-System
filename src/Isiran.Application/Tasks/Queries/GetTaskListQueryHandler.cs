using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Queries;

public class GetTaskListQueryHandler : IRequestHandler<GetTaskListQuery, PagedResult<GetTaskListDto>>
{
    private readonly IRepository<ProjectTask> _taskRepository;
    private readonly ILogger<GetTaskListQueryHandler> _logger;

    public GetTaskListQueryHandler(
        IRepository<ProjectTask> taskRepository,
        ILogger<GetTaskListQueryHandler> logger)
    {
        _taskRepository = taskRepository;
        _logger = logger;
    }

    public async Task<PagedResult<GetTaskListDto>> Handle(GetTaskListQuery request, CancellationToken cancellationToken)
    {
        // Build predicate for filtering
        var tasks = await _taskRepository.FindAsync(t =>
            (string.IsNullOrWhiteSpace(request.SearchTerm) ||
             t.Name.Contains(request.SearchTerm) ||
             (t.Description != null && t.Description.Contains(request.SearchTerm))) &&
            (!request.ProjectId.HasValue || t.ProjectId == request.ProjectId.Value) &&
            (!request.Status.HasValue || t.Status == request.Status.Value) &&
            (!request.Priority.HasValue || t.Priority == request.Priority.Value),
            cancellationToken);

        var taskList = tasks.ToList();
        var totalCount = taskList.Count;

        // Apply pagination
        var pagedTasks = taskList
            .OrderBy(t => t.DisplayOrder)
            .ThenBy(t => t.Name)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = pagedTasks.Select(t => new GetTaskListDto
        {
            Id = t.Id,
            ProjectId = t.ProjectId,
            Name = t.Name,
            Status = t.Status,
            Priority = t.Priority,
            StartDate = t.StartDate,
            EndDate = t.EndDate,
            PercentComplete = t.PercentComplete,
            AssignedToId = t.AssignedToId,
            AssignedToName = t.AssignedTo != null ? t.AssignedTo.FullName : null,
            WbsCode = t.WbsCode.Code,
        }).ToList();

        return new PagedResult<GetTaskListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

