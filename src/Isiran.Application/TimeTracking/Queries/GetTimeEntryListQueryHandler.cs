using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.TimeTracking.Queries;

public class GetTimeEntryListQueryHandler : IRequestHandler<GetTimeEntryListQuery, PagedResult<GetTimeEntryListDto>>
{
    private readonly IRepository<Domain.Tasks.TaskTimeEntry> _timeEntryRepository;
    private readonly ILogger<GetTimeEntryListQueryHandler> _logger;

    public GetTimeEntryListQueryHandler(
        IRepository<Domain.Tasks.TaskTimeEntry> timeEntryRepository,
        ILogger<GetTimeEntryListQueryHandler> logger)
    {
        _timeEntryRepository = timeEntryRepository;
        _logger = logger;
    }

    public async Task<PagedResult<GetTimeEntryListDto>> Handle(GetTimeEntryListQuery request, CancellationToken cancellationToken)
    {
        var timeEntries = await _timeEntryRepository.FindAsync(te =>
            !te.IsDeleted &&
            (!request.TaskId.HasValue || te.TaskId == request.TaskId.Value) &&
            (!request.ResourceId.HasValue || te.ResourceId == request.ResourceId.Value) &&
            (!request.StartDate.HasValue || te.Date >= request.StartDate.Value) &&
            (!request.EndDate.HasValue || te.Date <= request.EndDate.Value) &&
            (!request.ProjectId.HasValue || (te.Task != null && te.Task.ProjectId == request.ProjectId.Value)),
            cancellationToken);

        var totalCount = timeEntries.Count();
        var pagedEntries = timeEntries
            .OrderByDescending(te => te.Date)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = new List<GetTimeEntryListDto>();

        foreach (var entry in pagedEntries)
        {
            dtos.Add(new GetTimeEntryListDto
            {
                Id = entry.Id,
                TaskId = entry.TaskId,
                TaskName = entry.Task?.Name ?? "Unknown Task",
                ResourceId = entry.ResourceId,
                ResourceName = entry.Resource?.FullName ?? "Unknown Resource",
                Date = entry.Date,
                Hours = entry.Hours,
                Description = entry.Description,
                IsBillable = entry.IsBillable,
                HourlyRate = entry.HourlyRate,
                Cost = entry.IsBillable && entry.HourlyRate.HasValue
                    ? entry.Hours * entry.HourlyRate.Value
                    : null
            });
        }

        return new PagedResult<GetTimeEntryListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

