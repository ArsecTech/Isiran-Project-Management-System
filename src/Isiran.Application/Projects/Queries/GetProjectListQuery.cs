using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Projects.Queries;

public class GetProjectListQuery : IRequest<PagedResult<GetProjectListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Domain.Projects.ProjectStatus? Status { get; set; }
    public Domain.Projects.ProjectPriority? Priority { get; set; }
}

