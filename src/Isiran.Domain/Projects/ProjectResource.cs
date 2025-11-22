using Isiran.Domain.Common;
using Isiran.Domain.Resources;

namespace Isiran.Domain.Projects;

public class ProjectResource : BaseEntity
{
    public Guid ProjectId { get; private set; }
    public Guid ResourceId { get; private set; }
    public string Role { get; private set; } = string.Empty;
    public decimal AllocationPercentage { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public decimal HourlyRate { get; private set; }

    // Navigation properties
    public virtual Project Project { get; private set; } = null!;
    public virtual Resource Resource { get; private set; } = null!;

    private ProjectResource() { }

    public ProjectResource(
        Guid projectId,
        Guid resourceId,
        string role,
        decimal allocationPercentage,
        DateTime? startDate = null,
        DateTime? endDate = null,
        decimal hourlyRate = 0)
    {
        ProjectId = projectId;
        ResourceId = resourceId;
        Role = role;
        AllocationPercentage = allocationPercentage;
        StartDate = startDate;
        EndDate = endDate;
        HourlyRate = hourlyRate;
    }

    public void UpdateAllocation(decimal allocationPercentage, DateTime? startDate = null, DateTime? endDate = null)
    {
        AllocationPercentage = allocationPercentage;
        if (startDate.HasValue) StartDate = startDate;
        if (endDate.HasValue) EndDate = endDate;
        UpdateTimestamp();
    }

    public void UpdateHourlyRate(decimal hourlyRate)
    {
        HourlyRate = hourlyRate;
        UpdateTimestamp();
    }
}

