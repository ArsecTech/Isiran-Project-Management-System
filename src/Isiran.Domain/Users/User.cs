using Isiran.Domain.Common;

namespace Isiran.Domain.Users;

public class User : AggregateRoot
{
    public string Username { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string PasswordHash { get; private set; } = string.Empty;
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public bool IsActive { get; private set; } = true;
    public bool EmailConfirmed { get; private set; }
    public DateTime? LastLoginAt { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTime? RefreshTokenExpiryTime { get; private set; }

    // Navigation properties
    public virtual ICollection<UserRole> UserRoles { get; private set; } = new List<UserRole>();
    public virtual ICollection<UserPermission> UserPermissions { get; private set; } = new List<UserPermission>();

    private User() { }

    public User(
        string username,
        string email,
        string passwordHash,
        string firstName,
        string lastName)
    {
        Username = username;
        Email = email;
        PasswordHash = passwordHash;
        FirstName = firstName;
        LastName = lastName;
    }

    public string FullName => $"{FirstName} {LastName}";

    public void UpdatePassword(string passwordHash)
    {
        PasswordHash = passwordHash;
        UpdateTimestamp();
    }

    public void UpdateProfile(string? firstName = null, string? lastName = null, string? email = null)
    {
        if (firstName != null) FirstName = firstName;
        if (lastName != null) LastName = lastName;
        if (email != null) Email = email;
        UpdateTimestamp();
    }

    public void SetRefreshToken(string? refreshToken, DateTime? expiryTime)
    {
        RefreshToken = refreshToken;
        RefreshTokenExpiryTime = expiryTime;
        UpdateTimestamp();
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTime.UtcNow;
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

    public void ConfirmEmail()
    {
        EmailConfirmed = true;
        UpdateTimestamp();
    }
}

