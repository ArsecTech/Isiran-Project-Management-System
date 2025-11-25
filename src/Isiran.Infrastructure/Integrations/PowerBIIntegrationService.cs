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
    public class PowerBIIntegrationService : IPowerBIIntegrationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PowerBIIntegrationService> _logger;

        public PowerBIIntegrationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<PowerBIIntegrationService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<string> GetAuthorizationUrlAsync(string redirectUri, string state, CancellationToken cancellationToken = default)
        {
            var tenantId = _configuration["Integrations:PowerBI:TenantId"] ?? throw new InvalidOperationException("Power BI TenantId not configured");
            var clientId = _configuration["Integrations:PowerBI:ClientId"] ?? throw new InvalidOperationException("Power BI ClientId not configured");
            var scope = _configuration["Integrations:PowerBI:Scope"] ?? "https://analysis.windows.net/powerbi/api/.default offline_access";
            var authority = _configuration["Integrations:PowerBI:Authority"] ?? "https://login.microsoftonline.com";
            var baseUrl = $"{authority}/{tenantId}/oauth2/v2.0/authorize";
            
            var queryParams = new Dictionary<string, string>
            {
                { "client_id", clientId },
                { "response_type", "code" },
                { "redirect_uri", redirectUri },
                { "response_mode", "query" },
                { "scope", scope },
                { "state", state },
                { "prompt", "consent" }
            };

            var queryString = string.Join("&", queryParams.Select(kvp => $"{kvp.Key}={HttpUtility.UrlEncode(kvp.Value)}"));
            return $"{baseUrl}?{queryString}";
        }

        public async Task<IntegrationConfig> ExchangeCodeForTokenAsync(string code, string redirectUri, IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                var tenantId = _configuration["Integrations:PowerBI:TenantId"] ?? throw new InvalidOperationException("Power BI TenantId not configured");
                var authority = _configuration["Integrations:PowerBI:Authority"] ?? "https://login.microsoftonline.com";
                var scope = _configuration["Integrations:PowerBI:Scope"] ?? "https://analysis.windows.net/powerbi/api/.default offline_access";
                var tokenUrl = $"{authority}/{tenantId}/oauth2/v2.0/token";
                var clientId = config.ClientId ?? throw new InvalidOperationException("ClientId is required");
                var clientSecret = config.ClientSecret ?? throw new InvalidOperationException("ClientSecret is required");

                var requestBody = new Dictionary<string, string>
                {
                    { "grant_type", "authorization_code" },
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "code", code },
                    { "redirect_uri", redirectUri },
                    { "scope", scope }
                };

                var content = new FormUrlEncodedContent(requestBody);

                var response = await _httpClient.PostAsync(tokenUrl, content, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                config.AccessToken = tokenResponse.GetProperty("access_token").GetString();
                config.RefreshToken = tokenResponse.GetProperty("refresh_token").GetString();
                
                var expiresIn = tokenResponse.GetProperty("expires_in").GetInt32();
                config.TokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresIn);

                _logger.LogInformation("Successfully exchanged code for token for Power BI integration: {IntegrationName}", config.Name);
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

                var response = await _httpClient.GetAsync("https://api.powerbi.com/v1.0/myorg/groups", cancellationToken);
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
                var tenantId = _configuration["Integrations:PowerBI:TenantId"] ?? throw new InvalidOperationException("Power BI TenantId not configured");
                var authority = _configuration["Integrations:PowerBI:Authority"] ?? "https://login.microsoftonline.com";
                var scope = _configuration["Integrations:PowerBI:Scope"] ?? "https://analysis.windows.net/powerbi/api/.default offline_access";
                var tokenUrl = $"{authority}/{tenantId}/oauth2/v2.0/token";
                var clientId = config.ClientId ?? throw new InvalidOperationException("ClientId is required");
                var clientSecret = config.ClientSecret ?? throw new InvalidOperationException("ClientSecret is required");
                var refreshToken = config.RefreshToken ?? throw new InvalidOperationException("RefreshToken is required");

                var requestBody = new Dictionary<string, string>
                {
                    { "grant_type", "refresh_token" },
                    { "client_id", clientId },
                    { "client_secret", clientSecret },
                    { "refresh_token", refreshToken },
                    { "scope", scope }
                };

                var content = new FormUrlEncodedContent(requestBody);

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

                _logger.LogInformation("Successfully refreshed token for Power BI integration: {IntegrationName}", config.Name);
                return newAccessToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to refresh token");
                throw;
            }
        }

        public async Task<List<PowerBIWorkspace>> GetWorkspacesAsync(IntegrationConfig config, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = "https://api.powerbi.com/v1.0/myorg/groups";
                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonSerializer.Deserialize<JsonElement>(content);

                var workspaces = new List<PowerBIWorkspace>();
                if (result.TryGetProperty("value", out var value))
                {
                    foreach (var workspace in value.EnumerateArray())
                    {
                        workspaces.Add(new PowerBIWorkspace
                        {
                            Id = workspace.GetProperty("id").GetString() ?? string.Empty,
                            Name = workspace.GetProperty("name").GetString() ?? string.Empty,
                            IsReadOnly = workspace.TryGetProperty("isReadOnly", out var isReadOnly) && isReadOnly.GetBoolean()
                        });
                    }
                }

                return workspaces;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Power BI workspaces");
                throw;
            }
        }

        public async Task<List<PowerBIReportInfo>> GetReportsAsync(IntegrationConfig config, string? workspaceId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = string.IsNullOrEmpty(workspaceId)
                    ? "https://api.powerbi.com/v1.0/myorg/reports"
                    : $"https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/reports";

                var response = await _httpClient.GetAsync(url, cancellationToken);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var result = JsonSerializer.Deserialize<JsonElement>(content);

                var reports = new List<PowerBIReportInfo>();
                if (result.TryGetProperty("value", out var value))
                {
                    foreach (var report in value.EnumerateArray())
                    {
                        reports.Add(ParseReport(report, workspaceId));
                    }
                }

                return reports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Power BI reports");
                throw;
            }
        }

        public async Task<PowerBIReportInfo?> GetReportAsync(IntegrationConfig config, string reportId, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = $"https://api.powerbi.com/v1.0/myorg/reports/{reportId}";
                var response = await _httpClient.GetAsync(url, cancellationToken);
                
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                    return null;

                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync(cancellationToken);
                var report = JsonSerializer.Deserialize<JsonElement>(content);

                return ParseReport(report, null);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Power BI report: {ReportId}", reportId);
                throw;
            }
        }

        public async Task<string> GetEmbedTokenAsync(IntegrationConfig config, string reportId, string? workspaceId = null, CancellationToken cancellationToken = default)
        {
            try
            {
                await EnsureValidTokenAsync(config, cancellationToken);
                SetAuthorizationHeader(config);

                var url = string.IsNullOrEmpty(workspaceId)
                    ? $"https://api.powerbi.com/v1.0/myorg/reports/{reportId}/GenerateToken"
                    : $"https://api.powerbi.com/v1.0/myorg/groups/{workspaceId}/reports/{reportId}/GenerateToken";

                var requestBody = new
                {
                    accessLevel = "View"
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync(url, content, cancellationToken);
                response.EnsureSuccessStatusCode();

                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                var tokenResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

                return tokenResponse.GetProperty("token").GetString() ?? string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get Power BI embed token for report: {ReportId}", reportId);
                throw;
            }
        }

        public async Task<bool> SyncReportsAsync(IntegrationConfig config, Guid? projectId = null, string? workspaceId = null, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Syncing Power BI reports. ProjectId: {ProjectId}, WorkspaceId: {WorkspaceId}", projectId, workspaceId);
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

        private PowerBIReportInfo ParseReport(JsonElement report, string? workspaceId)
        {
            return new PowerBIReportInfo
            {
                Id = report.GetProperty("id").GetString() ?? string.Empty,
                Name = report.GetProperty("name").GetString() ?? string.Empty,
                Description = report.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                WebUrl = report.TryGetProperty("webUrl", out var webUrl) ? webUrl.GetString() : null,
                EmbedUrl = report.TryGetProperty("embedUrl", out var embedUrl) ? embedUrl.GetString() : null,
                WorkspaceId = workspaceId,
                DatasetId = report.TryGetProperty("datasetId", out var datasetId) ? datasetId.GetString() : null
            };
        }
    }
}

