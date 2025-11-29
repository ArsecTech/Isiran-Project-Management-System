using Isiran.Application.Common.Models;
using MediatR;

namespace Isiran.Application.Organizations.Queries;

public class GetOrganizationListQuery : IRequest<PagedResult<GetOrganizationDto>>
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchTerm { get; set; }
    public Guid? ParentOrganizationId { get; set; }
    public bool? IsActive { get; set; }
}

