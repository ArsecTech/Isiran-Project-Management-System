using MediatR;

namespace Isiran.Application.Organizations.Commands;

public class CreateOrganizationCommand : IRequest<Guid>
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Guid? ParentOrganizationId { get; set; }
    public string? ManagerId { get; set; }
}

