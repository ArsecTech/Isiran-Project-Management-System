namespace Isiran.Application.Organizations.Queries;

public class OrganizationTreeNodeDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public Guid? ParentOrganizationId { get; set; }
    public int Level { get; set; }
    public string? ManagerId { get; set; }
    public string? ManagerName { get; set; }
    public bool IsActive { get; set; }
    public int ResourcesCount { get; set; }
    public int ProjectsCount { get; set; }
    public List<OrganizationTreeNodeDto> Children { get; set; } = new();
}

