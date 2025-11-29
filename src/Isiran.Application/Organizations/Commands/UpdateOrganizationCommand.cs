using MediatR;

namespace Isiran.Application.Organizations.Commands;

public class UpdateOrganizationCommand : IRequest
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? ManagerId { get; set; }
}

