using Isiran.Domain.Common;

namespace Isiran.Domain.Integrations
{
    public class ConfluencePage : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public string PageId { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; } // Cached content
        public string Url { get; set; } = string.Empty;
        public string? SpaceKey { get; set; }
        public DateTime? LastSyncedAt { get; set; }

        public void UpdateContent(string content)
        {
            Content = content;
            LastSyncedAt = DateTime.UtcNow;
            UpdateTimestamp();
        }
    }
}

