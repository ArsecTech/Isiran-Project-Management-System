using MediatR;

namespace Isiran.Application.Users.Commands;

public class UpdateUserCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public bool? IsActive { get; set; }
    public List<Guid>? RoleIds { get; set; }
}

