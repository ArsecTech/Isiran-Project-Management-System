using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Roles.Queries;

public class GetRoleListQuery : IRequest<PagedResult<GetRoleListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
}

