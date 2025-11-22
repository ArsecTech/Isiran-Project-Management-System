using Isiran.Domain.Common;

namespace Isiran.Domain.Users;

public class Permission : BaseEntity
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string Module { get; private set; } = string.Empty;

    // Navigation properties
    public virtual ICollection<RolePermission> RolePermissions { get; private set; } = new List<RolePermission>();
    public virtual ICollection<UserPermission> UserPermissions { get; private set; } = new List<UserPermission>();

    private Permission() { }

    public Permission(string name, string module, string? description = null)
    {
        Name = name;
        Module = module;
        Description = description;
    }
}

