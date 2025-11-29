using Isiran.Domain.Common;
using Isiran.Domain.Organizations;
using Isiran.Domain.Projects;
using Isiran.Domain.Resources.ValueObjects;
using Isiran.Domain.Tasks;

namespace Isiran.Domain.Resources;

public class Resource : AggregateRoot
{
    public string FirstName { get; private set; } = string.Empty;
    public string LastName { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public string? PhoneNumber { get; private set; }
    public ResourceType Type { get; private set; }
    public ResourceStatus Status { get; private set; }
    public decimal MaxUnits { get; private set; } = 100; // percentage
    public decimal StandardRate { get; private set; }
    public decimal OvertimeRate { get; private set; }
    public string? Department { get; private set; }
    public string? JobTitle { get; private set; }
    public ResourceCalendar Calendar { get; private set; } = null!;
    public Guid? ManagerId { get; private set; }
    public Guid? OrganizationId { get; private set; }

    // Navigation properties
    public virtual Resource? Manager { get; private set; }
    public virtual ICollection<Resource> TeamMembers { get; private set; } = new List<Resource>();
    public virtual ICollection<ProjectResource> Projects { get; private set; } = new List<ProjectResource>();
    public virtual ICollection<TaskResource> Tasks { get; private set; } = new List<TaskResource>();
    public virtual Organizations.Organization? Organization { get; private set; }

    private Resource() { }

    public Resource(
        string firstName,
        string lastName,
        string email,
        ResourceType type,
        decimal standardRate = 0,
        decimal maxUnits = 100)
    {
        FirstName = firstName;
        LastName = lastName;
        Email = email;
        Type = type;
        Status = ResourceStatus.Active;
        StandardRate = standardRate;
        OvertimeRate = standardRate * 1.5m;
        MaxUnits = maxUnits;
        Calendar = new ResourceCalendar();
    }

    public string FullName => $"{FirstName} {LastName}";

    public void UpdateDetails(
        string? firstName = null,
        string? lastName = null,
        string? email = null,
        string? phoneNumber = null,
        string? department = null,
        string? jobTitle = null)
    {
        if (firstName != null) FirstName = firstName;
        if (lastName != null) LastName = lastName;
        if (email != null) Email = email;
        if (phoneNumber != null) PhoneNumber = phoneNumber;
        if (department != null) Department = department;
        if (jobTitle != null) JobTitle = jobTitle;
        UpdateTimestamp();
    }

    public void ChangeStatus(ResourceStatus status)
    {
        Status = status;
        UpdateTimestamp();
    }

    public void UpdateRates(decimal standardRate, decimal? overtimeRate = null)
    {
        StandardRate = standardRate;
        OvertimeRate = overtimeRate ?? standardRate * 1.5m;
        UpdateTimestamp();
    }

    public void UpdateMaxUnits(decimal maxUnits)
    {
        MaxUnits = Math.Clamp(maxUnits, 0, 100);
        UpdateTimestamp();
    }

    public void AssignManager(Guid? managerId)
    {
        ManagerId = managerId;
        UpdateTimestamp();
    }

    public void UpdateCalendar(ResourceCalendar calendar)
    {
        Calendar = calendar;
        UpdateTimestamp();
    }

    public void AssignToOrganization(Guid? organizationId)
    {
        OrganizationId = organizationId;
        UpdateTimestamp();
    }
}

public enum ResourceType
{
    Work = 0,
    Material = 1,
    Cost = 2
}

public enum ResourceStatus
{
    Active = 0,
    Inactive = 1,
    OnLeave = 2,
    Terminated = 3
}

