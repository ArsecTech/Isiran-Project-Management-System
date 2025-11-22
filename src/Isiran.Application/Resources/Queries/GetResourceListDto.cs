namespace Isiran.Application.Resources.Queries;

public class GetResourceListDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Domain.Resources.ResourceType Type { get; set; }
    public Domain.Resources.ResourceStatus Status { get; set; }
    public string? Department { get; set; }
    public string? JobTitle { get; set; }
}

