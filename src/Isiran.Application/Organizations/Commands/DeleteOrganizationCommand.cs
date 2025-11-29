using MediatR;

namespace Isiran.Application.Organizations.Commands;

public class DeleteOrganizationCommand : IRequest
{
    public Guid Id { get; set; }
}

