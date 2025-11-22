using MediatR;

namespace Isiran.Application.Users.Queries;

public class GetUserQuery : IRequest<GetUserDto?>
{
    public Guid Id { get; set; }
}

