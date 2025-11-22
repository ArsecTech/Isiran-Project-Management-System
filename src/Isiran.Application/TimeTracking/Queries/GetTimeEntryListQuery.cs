using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.TimeTracking.Queries;

public class GetTimeEntryListQuery : IRequest<PagedResult<GetTimeEntryListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? TaskId { get; set; }
    public Guid? ResourceId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}

