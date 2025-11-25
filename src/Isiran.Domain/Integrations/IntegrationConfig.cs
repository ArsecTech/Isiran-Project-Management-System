using Isiran.Domain.Common;

namespace Isiran.Domain.Integrations
{
    public enum IntegrationType
    {
        Jira = 0,
        Confluence = 1,
        PowerBI = 2
    }

    public class IntegrationConfig : BaseEntity
    {
        public IntegrationType IntegrationType { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; } // Encrypted
        public string? AccessToken { get; set; } // Encrypted
        public string? RefreshToken { get; set; } // Encrypted
        public DateTime? TokenExpiresAt { get; set; }
        public bool IsActive { get; set; } = true;

        public bool IsTokenExpired()
        {
            return TokenExpiresAt.HasValue && TokenExpiresAt.Value <= DateTime.UtcNow;
        }

    public bool NeedsTokenRefresh()
    {
        if (!TokenExpiresAt.HasValue) return false;
        // Refresh if token expires within 5 minutes
        return TokenExpiresAt.Value <= DateTime.UtcNow.AddMinutes(5);
    }

    public void UpdateDetails(string name, string baseUrl, string? clientId = null, string? clientSecret = null, bool? isActive = null)
    {
        Name = name;
        BaseUrl = baseUrl;
        if (clientId != null) ClientId = clientId;
        if (clientSecret != null) ClientSecret = clientSecret;
        if (isActive.HasValue) IsActive = isActive.Value;
        UpdateTimestamp();
    }

    public void UpdateTokens(string? accessToken, string? refreshToken, DateTime? expiresAt)
    {
        if (accessToken != null) AccessToken = accessToken;
        if (refreshToken != null) RefreshToken = refreshToken;
        if (expiresAt.HasValue) TokenExpiresAt = expiresAt;
        UpdateTimestamp();
    }
}
}

