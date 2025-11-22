using Isiran.Domain.Common;

namespace Isiran.Domain.Users;

public class UserPermission : BaseEntity
{
    public Guid UserId { get; private set; }
    public Guid PermissionId { get; private set; }

    // Navigation properties
    public virtual User User { get; private set; } = null!;
    public virtual Permission Permission { get; private set; } = null!;

    private UserPermission() { }

    public UserPermission(Guid userId, Guid permissionId)
    {
        UserId = userId;
        PermissionId = permissionId;
    }
}

