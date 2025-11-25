using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Web;

namespace Isiran.Infrastructure.Integrations
{
    public class ConfluenceIntegrationService : IConfluenceIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ConfluenceIntegrationService> _logger;

        public ConfluenceIntegrationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ConfluenceIntegrationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default)
        {
            var baseUrl = "https://auth.atlassian.com/authorize";
            var clientId = _configuration["Integrations:Confluence:ClientId"] ?? throw new InvalidOperationException("Confluence ClientId not configured");
            var scope = "read:confluence-content.all read:confluence-space.summary offline_access";
            
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

                _logger.LogInformation("Successfully exchanged code for token for Confluence integration: {IntegrationName}", config.Name);
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
                SetAuthorizationHeader(config);

                var response = await _httpClient.GetAsync($"{config.BaseUrl}/rest/api/user/current", cancellationToken);
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

                _logger.LogInformation("Successfully refreshed token for Confluence integration: {IntegrationName}", config.Name);
                return newAccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh token");
                throw;
            }
        }

        public async Task<List<ConfluenceSpace>> GetSpacesAsync(IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = $"{config.BaseUrl}/rest/api/space?limit=100";
                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonSerializer.Deserialize<JsonElement>(content);

                var spaces = new List<ConfluenceSpace>();
                if (result.TryGetProperty("results", out var results))
                {
                    foreach (var space in results.EnumerateArray())
                    {
                        spaces.Add(new ConfluenceSpace
                        {
                            Key = space.GetProperty("key").GetString() ?? string.Empty,
                            Name = space.GetProperty("name").GetString() ?? string.Empty,
                            Description = space.TryGetProperty("description", out var desc) 
                                ? desc.GetProperty("plain").GetProperty("value").GetString() : null
                        });
                    }
                }

                return spaces;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Confluence spaces");
                throw;
            }
        }

        public async Task<List<ConfluencePageInfo>> GetPagesAsync(IntegrationConfig config, string? spaceKey = null, string? query = null, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = $"{config.BaseUrl}/rest/api/content/search?limit=100";
                var cql = new List<string>();

                if (!string.IsNullOrEmpty(spaceKey))
                {
                    cql.Add($"space = {spaceKey}");
                }

                if (!string.IsNullOrEmpty(query))
                {
                    cql.Add($"text ~ \"{query}\"");
                }

                if (cql.Count > 0)
                {
                    url += $"&cql={HttpUtility.UrlEncode(string.Join(" AND ", cql))}";
                }

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonSerializer.Deserialize<JsonElement>(content);

                var pages = new List<ConfluencePageInfo>();
                if (result.TryGetProperty("results", out var results))
                {
                    foreach (var page in results.EnumerateArray())
                    {
                        pages.Add(ParsePage(page, config.BaseUrl));
                    }
                }

                return pages;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Confluence pages");
                throw;
            }
        }

        public async Task<ConfluencePageInfo?> GetPageAsync(IntegrationConfig config, string pageId, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = $"{config.BaseUrl}/rest/api/content/{pageId}?expand=body.storage,version,space";
                var response = await _httpClient.GetAsync(url, cancellationToken);
                
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var page = JsonSerializer.Deserialize<JsonElement>(content);

                return ParsePage(page, config.BaseUrl);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Confluence page: {PageId}", pageId);
                throw;
            }
        }

        public async Task<string> GetPageContentAsync(IntegrationConfig config, string pageId, CancellationToken cancellationToken = default)
        {
            try
            {
                var page = await GetPageAsync(config, pageId, cancellationToken);
                return page?.Content ?? string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Confluence page content: {PageId}", pageId);
                throw;
            }
        }

        public async Task<bool> SyncProjectPagesAsync(IntegrationConfig config, Guid projectId, string? spaceKey = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Syncing Confluence pages for project {ProjectId}, space: {SpaceKey}", projectId, spaceKey);
            // This will be implemented in the Application layer with proper repository access
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

        private ConfluencePageInfo ParsePage(JsonElement page, string baseUrl)
        {
            var id = page.GetProperty("id").GetString() ?? string.Empty;
            var title = page.GetProperty("title").GetString() ?? string.Empty;
            var space = page.GetProperty("space");
            var spaceKey = space.GetProperty("key").GetString();
            
            var url = $"{baseUrl}/pages/viewpage.action?pageId={id}";
            
            string? content = null;
            if (page.TryGetProperty("body", out var body) && 
                body.TryGetProperty("storage", out var storage) &&
                storage.TryGetProperty("value", out var value))
            {
                content = value.GetString();
                // Convert Confluence storage format to HTML or plain text
                content = ConvertConfluenceStorageToHtml(content);
            }

            var author = page.TryGetProperty("version", out var version) &&
                        version.TryGetProperty("by", out var by)
                ? by.GetProperty("displayName").GetString() : null;

            DateTime? created = null;
            if (page.TryGetProperty("version", out var ver) && ver.TryGetProperty("when", out var when))
            {
                var whenStr = when.GetString();
                if (!string.IsNullOrEmpty(whenStr))
                    created = DateTime.Parse(whenStr);
            }

            DateTime? updated = null;
            if (page.TryGetProperty("version", out var v) && v.TryGetProperty("when", out var updatedWhen))
            {
                var updatedWhenStr = updatedWhen.GetString();
                if (!string.IsNullOrEmpty(updatedWhenStr))
                    updated = DateTime.Parse(updatedWhenStr);
            }

            return new ConfluencePageInfo
            {
                Id = id,
                Title = title,
                Content = content,
                Url = url,
                SpaceKey = spaceKey,
                Author = author,
                Created = created,
                Updated = updated
            };
        }

        private string ConvertConfluenceStorageToHtml(string? storageContent)
        {
            if (string.IsNullOrEmpty(storageContent))
                return string.Empty;

            // Basic conversion from Confluence storage format to HTML
            // This is a simplified version - in production, use a proper Confluence parser
            var html = storageContent
                .Replace("<ac:link>", "<a>")
                .Replace("</ac:link>", "</a>")
                .Replace("<ac:image>", "<img>")
                .Replace("</ac:image>", "</img>");

            // Remove Confluence-specific tags and convert to readable format
            html = Regex.Replace(html, @"<ac:[^>]+>", "");
            html = Regex.Replace(html, @"</ac:[^>]+>", "");

            return html;
        }
    }
}

