using MediatR;

namespace Isiran.Application.Resources.Commands;

public class CreateResourceCommand : IRequest<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public Domain.Resources.ResourceType Type { get; set; } = Domain.Resources.ResourceType.Work;
    public decimal StandardRate { get; set; }
    public decimal MaxUnits { get; set; } = 100;
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
}

