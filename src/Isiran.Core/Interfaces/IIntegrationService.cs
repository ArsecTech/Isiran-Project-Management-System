using Isiran.Domain.Integrations;

namespace Isiran.Core.Interfaces
{
    public interface IIntegrationService
    {
        Task<bool> TestConnectionAsync(IntegrationConfig config, CancellationToken cancellationToken = default);
        Task<string?> RefreshTokenAsync(IntegrationConfig config, CancellationToken cancellationToken = default);
    }
}

