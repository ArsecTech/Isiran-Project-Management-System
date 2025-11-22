using MediatR;

namespace Isiran.Application.Users.Commands;

public class CreateUserCommand : IRequest<Guid>
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public List<Guid> RoleIds { get; set; } = new();
    public bool IsActive { get; set; } = true;
}

