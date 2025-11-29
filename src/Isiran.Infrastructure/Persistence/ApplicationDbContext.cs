using Isiran.Domain.Integrations;
using Isiran.Domain.Notifications;
using Isiran.Domain.Organizations;
using Isiran.Domain.Projects;
using Isiran.Domain.Resources;
using Isiran.Domain.Tasks;
using Isiran.Domain.Users;
using Microsoft.EntityFrameworkCore;

using System.Reflection;

namespace Isiran.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Projects
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectResource> ProjectResources => Set<ProjectResource>();
    public DbSet<ProjectMilestone> ProjectMilestones => Set<ProjectMilestone>();

    // Tasks
    public DbSet<ProjectTask> Tasks => Set<ProjectTask>();
    public DbSet<TaskDependency> TaskDependencies => Set<TaskDependency>();
    public DbSet<TaskResource> TaskResources => Set<TaskResource>();
    public DbSet<TaskTimeEntry> TaskTimeEntries => Set<TaskTimeEntry>();

    // Resources
    public DbSet<Resource> Resources => Set<Resource>();

    // Organizations
    public DbSet<Organization> Organizations => Set<Organization>();

    // Users
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();

    // Notifications
    public DbSet<Notification> Notifications => Set<Notification>();

    // Integrations
    public DbSet<IntegrationConfig> IntegrationConfigs => Set<IntegrationConfig>();
    public DbSet<SyncLog> SyncLogs => Set<SyncLog>();
    public DbSet<JiraProject> JiraProjects => Set<JiraProject>();
    public DbSet<ConfluencePage> ConfluencePages => Set<ConfluencePage>();
    public DbSet<PowerBIReport> PowerBIReports => Set<PowerBIReport>();

    // KPIs
    public DbSet<KPIMetric> KPIMetrics => Set<KPIMetric>();

    // Activity Dependencies
    public DbSet<ActivityDependency> ActivityDependencies => Set<ActivityDependency>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configure RowVersion for all BaseEntity types
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(Domain.Common.BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var entityBuilder = modelBuilder.Entity(entityType.ClrType);
                var rowVersionProperty = entityType.FindProperty(nameof(Domain.Common.BaseEntity.RowVersion));
                if (rowVersionProperty != null)
                {
                    entityBuilder.Property(typeof(byte[]), nameof(Domain.Common.BaseEntity.RowVersion))
                        .IsRowVersion()
                        .ValueGeneratedOnAddOrUpdate();
                }
            }
        }
        
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Update timestamps
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is Domain.Common.BaseEntity && 
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (Domain.Common.BaseEntity)entry.Entity;
            
            if (entry.State == EntityState.Added)
            {
                // CreatedAt is set by default in BaseEntity constructor
                // If we need to override it, we can use reflection or add a method
                var createdAtProperty = entity.GetType().GetProperty("CreatedAt");
                if (createdAtProperty != null && createdAtProperty.CanWrite)
                {
                    createdAtProperty.SetValue(entity, DateTime.UtcNow);
                }
            }
            else if (entry.State == EntityState.Modified)
            {
                entity.UpdateTimestamp();
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}

