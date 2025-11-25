using Isiran.Domain.Common;

namespace Isiran.Domain.Integrations
{
    public enum SyncStatus
    {
        Success = 0,
        Failed = 1,
        InProgress = 2
    }

    public class SyncLog : BaseEntity
    {
        public IntegrationType IntegrationType { get; set; }
        public Guid? ProjectId { get; set; }
        public SyncStatus Status { get; set; }
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
        public int? RecordsSynced { get; set; }
        public string? ErrorMessage { get; set; }
        public Guid? CreatedByUserId { get; set; } // Renamed to avoid conflict with BaseEntity.CreatedBy

        public void MarkAsCompleted(int recordsSynced)
        {
            Status = SyncStatus.Success;
            EndTime = DateTime.UtcNow;
            RecordsSynced = recordsSynced;
        }

        public void MarkAsFailed(string errorMessage)
        {
            Status = SyncStatus.Failed;
            EndTime = DateTime.UtcNow;
            ErrorMessage = errorMessage;
        }
    }
}

