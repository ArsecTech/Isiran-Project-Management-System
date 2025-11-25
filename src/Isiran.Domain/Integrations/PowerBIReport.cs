using Isiran.Domain.Common;

namespace Isiran.Domain.Integrations
{
    public class PowerBIReport : BaseEntity
    {
        public Guid? ProjectId { get; set; }
        public string ReportId { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? EmbedUrl { get; set; }
        public string? WorkspaceId { get; set; }
        public string? DatasetId { get; set; }
        public DateTime? LastSyncedAt { get; set; }

        public void UpdateSyncTime()
        {
            LastSyncedAt = DateTime.UtcNow;
            UpdateTimestamp();
        }
    }
}

