using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Users.Queries;

public class GetUserListQuery : IRequest<PagedResult<GetUserListDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
}

