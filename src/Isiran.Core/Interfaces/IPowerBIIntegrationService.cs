using Isiran.Domain.Integrations;

namespace Isiran.Core.Interfaces
{
    public class PowerBIReportInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? EmbedUrl { get; set; }
        public string? WorkspaceId { get; set; }
        public string? DatasetId { get; set; }
        public string? WebUrl { get; set; }
    }

    public class PowerBIWorkspace
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public bool IsReadOnly { get; set; }
    }

    public interface IPowerBIIntegrationService : IIntegrationService
    {
        Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default);
        Task<IntegrationConfig> ExchangeCodeForTokenAsync(string code, string redirectUri, IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<PowerBIWorkspace>> GetWorkspacesAsync(IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<PowerBIReportInfo>> GetReportsAsync(IntegrationConfig config, string? workspaceId = null, CancellationToken cancellationToken = default);
        Task<PowerBIReportInfo?> GetReportAsync(IntegrationConfig config, string reportId, CancellationToken cancellationToken = default);
        Task<string> GetEmbedTokenAsync(IntegrationConfig config, string reportId, string? workspaceId = null, CancellationToken cancellationToken = default);
        Task<bool> SyncReportsAsync(IntegrationConfig config, Guid? projectId = null, string? workspaceId = null, CancellationToken cancellationToken = default);
    }
}

