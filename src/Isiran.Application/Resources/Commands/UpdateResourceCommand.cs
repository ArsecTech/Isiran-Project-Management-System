using MediatR;

namespace Isiran.Application.Resources.Commands;

public class UpdateResourceCommand : IRequest<Unit>
{
    public Guid Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public Domain.Resources.ResourceType? Type { get; set; }
    public Domain.Resources.ResourceStatus? Status { get; set; }
    public decimal? StandardRate { get; set; }
    public decimal? OvertimeRate { get; set; }
    public decimal? MaxUnits { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ManagerId { get; set; }
}

