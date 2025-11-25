using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Web;

namespace Isiran.Infrastructure.Integrations
{
    public class JiraIntegrationService : IJiraIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<JiraIntegrationService> _logger;

        public JiraIntegrationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<JiraIntegrationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default)
        {
            var baseUrl = "https://auth.atlassian.com/authorize";
            var clientId = _configuration["Integrations:Jira:ClientId"] ?? throw new InvalidOperationException("Jira ClientId not configured");
            var scope = "read:jira-work write:jira-work read:jira-user offline_access";
            
            var queryParams = new Dictionary<string, string>
            {
                { "audience", "api.atlassian.com" },
                { "client_id", clientId },
                { "scope", scope },
                { "redirect_uri", redirectUri },
                { "state", state },
                { "response_type", "code" },
                { "prompt", "consent" }
            };

            var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={HttpUtility.UrlEncode(kvp.Value)}"));
            return $"{baseUrl}?{queryString}";
        }

        public async Task<IntegrationConfig> ExchangeCodeForTokenAsync(string code, string redirectUri, IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                var tokenUrl = "https://auth.atlassian.com/oauth/token";
                var clientId = config.ClientId ?? throw new InvalidOperationException("ClientId is required");
                var clientSecret = config.ClientSecret ?? throw new InvalidOperationException("ClientSecret is required");

                var requestBody = new
                {
                    grant_type = "authorization_code",
                    client_id = clientId,
                    client_secret = clientSecret,
                    code = code,
                    redirect_uri = redirectUri
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(tokenUrl, content, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                config.AccessToken = tokenResponse.GetProperty("access_token").GetString();
                config.RefreshToken = tokenResponse.GetProperty("refresh_token").GetString();
                
                var expiresIn = tokenResponse.GetProperty("expires_in").GetInt32();
                config.TokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn);

                _logger.LogInformation("Successfully exchanged code for token for integration: {IntegrationName}", config.Name);
                return config;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to exchange code for token");
                throw;
            }
        }

        public async Task<bool> TestConnectionAsync(IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                var response = await _httpClient.GetAsync($"{config.BaseUrl}/rest/api/3/myself", cancellationToken);
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }

        public async Task<string?> RefreshTokenAsync(IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                var tokenUrl = "https://auth.atlassian.com/oauth/token";
                var clientId = config.ClientId ?? throw new InvalidOperationException("ClientId is required");
                var clientSecret = config.ClientSecret ?? throw new InvalidOperationException("ClientSecret is required");
                var refreshToken = config.RefreshToken ?? throw new InvalidOperationException("RefreshToken is required");

                var requestBody = new
                {
                    grant_type = "refresh_token",
                    client_id = clientId,
                    client_secret = clientSecret,
                    refresh_token = refreshToken
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(tokenUrl, content, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                var newAccessToken = tokenResponse.GetProperty("access_token").GetString();
                config.AccessToken = newAccessToken;

                if (tokenResponse.TryGetProperty("refresh_token", out var newRefreshToken))
                {
                    config.RefreshToken = newRefreshToken.GetString();
                }

                if (tokenResponse.TryGetProperty("expires_in", out var expiresIn))
                {
                    config.TokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn.GetInt32());
                }

                _logger.LogInformation("Successfully refreshed token for integration: {IntegrationName}", config.Name);
                return newAccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh token");
                throw;
            }
        }

        public async Task<List<JiraProjectInfo>> GetProjectsAsync(IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var response = await _httpClient.GetAsync($"{config.BaseUrl}/rest/api/3/project", cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var projects = JsonSerializer.Deserialize<List<JsonElement>>(content) ?? new List<JsonElement>();

                return projects.Select(p => new JiraProjectInfo
                {
                    Key = p.GetProperty("key").GetString() ?? string.Empty,
                    Id = p.GetProperty("id").GetString() ?? string.Empty,
                    Name = p.GetProperty("name").GetString() ?? string.Empty,
                    Description = p.TryGetProperty("description", out var desc) ? desc.GetString() : null
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Jira projects");
                throw;
            }
        }

        public async Task<List<JiraIssue>> GetIssuesAsync(IntegrationConfig config, string projectKey, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var jql = $"project = {projectKey} ORDER BY created DESC";
                var encodedJql = HttpUtility.UrlEncode(jql);
                var url = $"{config.BaseUrl}/rest/api/3/search?jql={encodedJql}&maxResults=100";

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var searchResult = JsonSerializer.Deserialize<JsonElement>(content);

                var issues = new List<JiraIssue>();
                if (searchResult.TryGetProperty("issues", out var issuesArray))
                {
                    foreach (var issue in issuesArray.EnumerateArray())
                    {
                        issues.Add(ParseIssue(issue));
                    }
                }

                return issues;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Jira issues for project: {ProjectKey}", projectKey);
                throw;
            }
        }

        public async Task<JiraIssue?> GetIssueAsync(IntegrationConfig config, string issueKey, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var response = await _httpClient.GetAsync($"{config.BaseUrl}/rest/api/3/issue/{issueKey}", cancellationToken);
                
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var issue = JsonSerializer.Deserialize<JsonElement>(content);

                return ParseIssue(issue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Jira issue: {IssueKey}", issueKey);
                throw;
            }
        }

        public async Task<JiraIssue> UpdateIssueAsync(IntegrationConfig config, string issueKey, Dictionary<string, object> fields, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var requestBody = new
                {
                    fields = fields
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PutAsync($"{config.BaseUrl}/rest/api/3/issue/{issueKey}", content, cancellationToken);
                response.EnsureSuccessStatusCode();

                return await GetIssueAsync(config, issueKey, cancellationToken) 
                    ?? throw new InvalidOperationException($"Issue {issueKey} not found after update");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update Jira issue: {IssueKey}", issueKey);
                throw;
            }
        }

        public async Task<bool> SyncProjectAsync(IntegrationConfig config, Guid projectId, string jiraProjectKey, CancellationToken cancellationToken = default)
        {
            // This will be implemented in the Application layer with proper repository access
            // For now, return true as placeholder
            _logger.LogInformation("Syncing project {ProjectId} with Jira project {JiraProjectKey}", projectId, jiraProjectKey);
            return await Task.FromResult(true);
        }

        private async Task EnsureValidTokenAsync(IntegrationConfig config, CancellationToken cancellationToken)
        {
            if (config.NeedsTokenRefresh())
            {
                await RefreshTokenAsync(config, cancellationToken);
            }

            if (string.IsNullOrEmpty(config.AccessToken))
            {
                throw new InvalidOperationException("Access token is not available. Please authenticate first.");
            }
        }

        private void SetAuthorizationHeader(IntegrationConfig config)
        {
            _httpClient.DefaultRequestHeaders.Authorization = 
                new AuthenticationHeaderValue("Bearer", config.AccessToken);
        }

        private JiraIssue ParseIssue(JsonElement issue)
        {
            var fields = issue.GetProperty("fields");
            
            return new JiraIssue
            {
                Key = issue.GetProperty("key").GetString() ?? string.Empty,
                Id = issue.GetProperty("id").GetString() ?? string.Empty,
                Summary = fields.GetProperty("summary").GetString() ?? string.Empty,
                Description = fields.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                Status = fields.GetProperty("status").GetProperty("name").GetString() ?? string.Empty,
                Assignee = fields.TryGetProperty("assignee", out var assignee) && assignee.ValueKind != JsonValueKind.Null 
                    ? assignee.GetProperty("displayName").GetString() : null,
                Created = fields.TryGetProperty("created", out var created) 
                    ? DateTime.Parse(created.GetString() ?? string.Empty) : null,
                Updated = fields.TryGetProperty("updated", out var updated) 
                    ? DateTime.Parse(updated.GetString() ?? string.Empty) : null,
                DueDate = fields.TryGetProperty("duedate", out var dueDate) && dueDate.ValueKind != JsonValueKind.Null
                    ? DateTime.Parse(dueDate.GetString() ?? string.Empty) : null,
                Priority = fields.TryGetProperty("priority", out var priority) && priority.ValueKind != JsonValueKind.Null
                    ? priority.GetProperty("name").GetString() : null,
                IssueType = fields.GetProperty("issuetype").GetProperty("name").GetString() ?? string.Empty
            };
        }
    }
}

