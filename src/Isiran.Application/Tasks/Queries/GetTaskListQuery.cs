using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Tasks.Queries;

public class GetTaskListQuery : IRequest<PagedResult<GetTaskListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? ProjectId { get; set; }
    public Domain.Tasks.TaskStatus? Status { get; set; }
    public Domain.Tasks.TaskPriority? Priority { get; set; }
}

