using MediatR;

namespace Isiran.Application.Resources.Queries;

public class GetResourceQuery : IRequest<GetResourceDto?>
{
    public Guid Id { get; set; }
}

