using Isiran.Domain.Integrations;

namespace Isiran.Core.Interfaces
{
    public class ConfluencePageInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Content { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? SpaceKey { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? Updated { get; set; }
        public string? Author { get; set; }
    }

    public class ConfluenceSpace
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public interface IConfluenceIntegrationService : IIntegrationService
    {
        Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default);
        Task<IntegrationConfig> ExchangeCodeForTokenAsync(string code, string redirectUri, IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<ConfluenceSpace>> GetSpacesAsync(IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<ConfluencePageInfo>> GetPagesAsync(IntegrationConfig config, string? spaceKey = null, string? query = null, CancellationToken cancellationToken = default);
        Task<ConfluencePageInfo?> GetPageAsync(IntegrationConfig config, string pageId, CancellationToken cancellationToken = default);
        Task<string> GetPageContentAsync(IntegrationConfig config, string pageId, CancellationToken cancellationToken = default);
        Task<bool> SyncProjectPagesAsync(IntegrationConfig config, Guid projectId, string? spaceKey = null, CancellationToken cancellationToken = default);
    }
}

