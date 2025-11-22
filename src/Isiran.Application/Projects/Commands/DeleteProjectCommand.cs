using MediatR;

namespace Isiran.Application.Projects.Commands;

public class DeleteProjectCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}

