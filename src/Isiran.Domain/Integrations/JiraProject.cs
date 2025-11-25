using Isiran.Domain.Common;

namespace Isiran.Domain.Integrations
{
    public class JiraProject : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public string JiraProjectKey { get; set; } = string.Empty;
        public string JiraProjectId { get; set; } = string.Empty;
        public string JiraProjectName { get; set; } = string.Empty;
        public DateTime? LastSyncedAt { get; set; }

        public void UpdateSyncTime()
        {
            LastSyncedAt = DateTime.UtcNow;
            UpdateTimestamp();
        }
    }
}

