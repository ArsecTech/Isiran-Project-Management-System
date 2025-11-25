using Isiran.Domain.Integrations;

namespace Isiran.Core.Interfaces
{
    public class JiraIssue
    {
        public string Key { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Assignee { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? Updated { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Priority { get; set; }
        public string IssueType { get; set; } = string.Empty;
    }

    public class JiraProjectInfo
    {
        public string Key { get; set; } = string.Empty;
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public interface IJiraIntegrationService : IIntegrationService
    {
        Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default);
        Task<IntegrationConfig> ExchangeCodeForTokenAsync(string code, string redirectUri, IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<JiraProjectInfo>> GetProjectsAsync(IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<List<JiraIssue>> GetIssuesAsync(IntegrationConfig config, string projectKey, CancellationToken cancellationToken = default);
        Task<JiraIssue?> GetIssueAsync(IntegrationConfig config, string issueKey, CancellationToken cancellationToken = default);
        Task<JiraIssue> UpdateIssueAsync(IntegrationConfig config, string issueKey, Dictionary<string, object> fields, CancellationToken cancellationToken = default);
        Task<bool> SyncProjectAsync(IntegrationConfig config, Guid projectId, string jiraProjectKey, CancellationToken cancellationToken = default);
    }
} 