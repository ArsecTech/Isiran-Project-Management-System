using Isiran.Domain.Common;

namespace Isiran.Domain.Organizations;

public class Organization : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string? Code { get; private set; }
    public Guid? ParentOrganizationId { get; private set; }
    public int Level { get; private set; }
    public string? ManagerId { get; private set; } // User ID who manages this organization
    public bool IsActive { get; private set; } = true;

    // Navigation properties
    public virtual Organization? ParentOrganization { get; private set; }
    public virtual ICollection<Organization> SubOrganizations { get; private set; } = new List<Organization>();

    private Organization() { }

    public Organization(
        string name,
        string? code = null,
        string? description = null,
        Guid? parentOrganizationId = null,
        string? managerId = null)
    {
        Name = name;
        Code = code;
        Description = description;
        ParentOrganizationId = parentOrganizationId;
        ManagerId = managerId;
        IsActive = true;
        Level = parentOrganizationId.HasValue ? 1 : 0; // Will be calculated properly in application layer
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string name,
        string? description = null,
        string? code = null,
        string? managerId = null)
    {
        Name = name;
        if (description != null) Description = description;
        if (code != null) Code = code;
        if (managerId != null) ManagerId = managerId;
        UpdateTimestamp();
    }

    public void ChangeParent(Guid? parentOrganizationId)
    {
        // Prevent circular reference
        if (parentOrganizationId.HasValue && parentOrganizationId.Value == Id)
        {
            throw new InvalidOperationException("An organization cannot be its own parent.");
        }

        ParentOrganizationId = parentOrganizationId;
        UpdateTimestamp();
    }

    public void SetLevel(int level)
    {
        Level = Math.Max(0, level);
        UpdateTimestamp();
    }

    public void Activate()
    {
        IsActive = true;
        UpdateTimestamp();
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdateTimestamp();
    }
}

