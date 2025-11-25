using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Queries
{
    public class GetIntegrationConfigQueryHandler : IRequestHandler<GetIntegrationConfigQuery, IntegrationConfigDto?>
    {
        private readonly IRepository<Domain.Integrations.IntegrationConfig> _repository;
        private readonly ILogger<GetIntegrationConfigQueryHandler> _logger;

        public GetIntegrationConfigQueryHandler(
            IRepository<Domain.Integrations.IntegrationConfig> repository,
            ILogger<GetIntegrationConfigQueryHandler> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<IntegrationConfigDto?> Handle(GetIntegrationConfigQuery request, CancellationToken cancellationToken)
        {
            var config = await _repository.GetByIdAsync(request.Id, cancellationToken);
            
            if (config == null)
                return null;

            return new IntegrationConfigDto
            {
                Id = config.Id,
                IntegrationType = config.IntegrationType,
                Name = config.Name,
                BaseUrl = config.BaseUrl,
                IsActive = config.IsActive,
                TokenExpiresAt = config.TokenExpiresAt,
                IsTokenExpired = config.IsTokenExpired(),
                CreatedAt = config.CreatedAt,
                UpdatedAt = config.UpdatedAt ?? config.CreatedAt
            };
        }
    }
}

