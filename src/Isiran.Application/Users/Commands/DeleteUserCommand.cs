using MediatR;

namespace Isiran.Application.Users.Commands;

public class DeleteUserCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
}

