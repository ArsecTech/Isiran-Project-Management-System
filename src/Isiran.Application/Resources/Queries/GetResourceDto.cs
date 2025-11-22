namespace Isiran.Application.Resources.Queries;

public class GetResourceDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public Domain.Resources.ResourceType Type { get; set; }
    public Domain.Resources.ResourceStatus Status { get; set; }
    public decimal MaxUnits { get; set; }
    public decimal StandardRate { get; set; }
    public decimal OvertimeRate { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
    public Guid? ManagerId { get; set; }
}

