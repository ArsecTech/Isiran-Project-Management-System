using MediatR;

namespace Isiran.Application.Resources.Commands;

public class DeleteResourceCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}

