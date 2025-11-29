using Isiran.Domain.Common;
using Isiran.Domain.Organizations;
using Isiran.Domain.Projects.ValueObjects;
using Isiran.Domain.Tasks;

namespace Isiran.Domain.Projects;

public class Project : AggregateRoot
{
    public string Name { get; private set; } = string.Empty;
    public string? Description { get; private set; }
    public string Code { get; private set; } = string.Empty;
    public ProjectStatus Status { get; private set; }
    public ProjectPriority Priority { get; private set; }
    public DateTime? StartDate { get; private set; }
    public DateTime? EndDate { get; private set; }
    public DateTime? ActualStartDate { get; private set; }
    public DateTime? ActualEndDate { get; private set; }
    public decimal Budget { get; private set; }
    public decimal ActualCost { get; private set; }
    public Guid? ProjectManagerId { get; private set; }
    public Guid? OwnerId { get; private set; }
    public ProjectSettings? Settings { get; private set; }
    public ProjectNature Nature { get; private set; }
    public string? Center { get; private set; } // مرکز/دپارتمان
    public Guid? OrganizationId { get; private set; } // سازمان/دپارتمان
    public int? SelfReportedProgress { get; private set; } // درصد پیشرفت خوداظهاری
    public int? ApprovedProgress { get; private set; } // درصد پیشرفت تایید شده کارفرما
    public DateTime? LastUpdatedByExecutor { get; private set; } // تاریخ آخرین بروزرسانی توسط مجری
    public DateTime? LastApprovedByClient { get; private set; } // تاریخ آخرین اخذ تایید کارفرما

    // Navigation properties
    public virtual ICollection<ProjectTask> Tasks { get; private set; } = new List<ProjectTask>();
    public virtual ICollection<ProjectResource> Resources { get; private set; } = new List<ProjectResource>();
    public virtual ICollection<ProjectMilestone> Milestones { get; private set; } = new List<ProjectMilestone>();
    public virtual Organization? Organization { get; private set; }

    private Project() { }

    public Project(
        string name,
        string code,
        Guid? projectManagerId = null,
        Guid? ownerId = null,
        string? description = null,
        ProjectPriority priority = ProjectPriority.Medium,
        DateTime? startDate = null,
        DateTime? endDate = null,
        decimal budget = 0,
        ProjectNature nature = ProjectNature.DesignAndImplementation,
        string? center = null)
    {
        Name = name;
        Code = code;
        ProjectManagerId = projectManagerId;
        OwnerId = ownerId;
        Description = description;
        Priority = priority;
        Status = ProjectStatus.Planning;
        StartDate = startDate;
        EndDate = endDate;
        Budget = budget;
        ActualCost = 0;
        Nature = nature;
        Center = center;
        SelfReportedProgress = 0;
        ApprovedProgress = 0;
        Settings = new ProjectSettings(); // Initialize with default values
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateDetails(
        string name,
        string? description = null,
        ProjectPriority? priority = null,
        DateTime? startDate = null,
        DateTime? endDate = null,
        decimal? budget = null)
    {
        Name = name;
        if (description != null) Description = description;
        if (priority.HasValue) Priority = priority.Value;
        if (startDate.HasValue) StartDate = startDate;
        if (endDate.HasValue) EndDate = endDate;
        if (budget.HasValue) Budget = budget.Value;
        UpdateTimestamp();
    }

    public void ChangeStatus(ProjectStatus newStatus)
    {
        if (Status == newStatus) return;

        var oldStatus = Status;
        Status = newStatus;

        if (newStatus == ProjectStatus.InProgress && !ActualStartDate.HasValue)
        {
            ActualStartDate = DateTime.UtcNow;
        }

        if (newStatus == ProjectStatus.Completed || newStatus == ProjectStatus.Cancelled)
        {
            ActualEndDate = DateTime.UtcNow;
        }

        UpdateTimestamp();
        AddDomainEvent(new ProjectStatusChangedEvent(Id, oldStatus, newStatus));
    }

    public void AssignProjectManager(Guid projectManagerId)
    {
        ProjectManagerId = projectManagerId;
        UpdateTimestamp();
    }

    public void UpdateBudget(decimal newBudget)
    {
        Budget = newBudget;
        UpdateTimestamp();
    }

    public void RecordCost(decimal cost)
    {
        ActualCost += cost;
        UpdateTimestamp();
    }

    public void UpdateSettings(ProjectSettings settings)
    {
        Settings = settings;
        UpdateTimestamp();
    }

    public void UpdateNature(ProjectNature nature)
    {
        Nature = nature;
        UpdateTimestamp();
    }

    public void UpdateCenter(string? center)
    {
        Center = center;
        UpdateTimestamp();
    }

    public void UpdateSelfReportedProgress(int? progress)
    {
        if (progress.HasValue)
        {
            SelfReportedProgress = Math.Clamp(progress.Value, 0, 100);
        }
        else
        {
            SelfReportedProgress = null;
        }
        LastUpdatedByExecutor = DateTime.UtcNow;
        UpdateTimestamp();
    }

    public void UpdateApprovedProgress(int? progress)
    {
        if (progress.HasValue)
        {
            ApprovedProgress = Math.Clamp(progress.Value, 0, 100);
        }
        else
        {
            ApprovedProgress = null;
        }
        LastApprovedByClient = DateTime.UtcNow;
        UpdateTimestamp();
    }

    public void AssignToOrganization(Guid? organizationId)
    {
        OrganizationId = organizationId;
        UpdateTimestamp();
    }
}

public enum ProjectStatus
{
    Planning = 0,
    InProgress = 1,
    OnHold = 2,
    Completed = 3,
    Cancelled = 4
}

public enum ProjectPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum ProjectNature
{
    DesignAndImplementation = 0,  // طراحی و پیاده‌سازی
    Support = 1,                  // پشتیبانی
    Development = 2,              // توسعه
    Procurement = 3               // تامین
}

