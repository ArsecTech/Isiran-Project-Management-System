using MediatR;

namespace Isiran.Application.Tasks.Queries;

public class GetTaskQuery : IRequest<GetTaskDto?>
{
    public Guid Id { get; set; }
}

