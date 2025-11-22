using Isiran.Domain.Common;

namespace Isiran.Domain.Users;

public class Role : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public bool IsSystemRole { get; private set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();
    public virtual ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();

    private Role() { }

    public Role(string name, string? description = null, bool isSystemRole = false)
    {
        Name = name;
        Description = description;
        IsSystemRole = isSystemRole;
    }

    public void UpdateDetails(string? name = null, string? description = null)
    {
        if (name != null) Name = name;
        if (description != null) Description = description;
        UpdateTimestamp();
    }
}

