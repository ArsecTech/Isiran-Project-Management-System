using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncJiraProjectCommand : IRequest<SyncResult>
    {
        public Guid ProjectId { get; set; }
        public Guid IntegrationConfigId { get; set; }
        public string JiraProjectKey { get; set; } = string.Empty;
    }

    public class SyncResult
    {
        public bool Success { get; set; }
        public int RecordsSynced { get; set; }
        public string? ErrorMessage { get; set; }
        public Guid SyncLogId { get; set; }
    }
}

