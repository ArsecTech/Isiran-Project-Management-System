using MediatR;

namespace Isiran.Application.Organizations.Queries;

public class GetOrganizationTreeQuery : IRequest<List<OrganizationTreeNodeDto>>
{
}

