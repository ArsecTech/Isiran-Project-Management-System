using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Resources.Queries;

public class GetResourceListQuery : IRequest<PagedResult<GetResourceListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Domain.Resources.ResourceType? Type { get; set; }
    public Domain.Resources.ResourceStatus? Status { get; set; }
}

