using MediatR;

namespace Isiran.Application.Projects.Queries;

public class GetProjectQuery : IRequest<GetProjectDto?>
{
    public Guid Id { get; set; }
}

