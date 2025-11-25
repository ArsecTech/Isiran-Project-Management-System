using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Queries
{
    public class GetIntegrationConfigsQueryHandler : IRequestHandler<GetIntegrationConfigsQuery, List<IntegrationConfigDto>>
    {
        private readonly IRepository<Domain.Integrations.IntegrationConfig> _repository;
        private readonly ILogger<GetIntegrationConfigsQueryHandler> _logger;

        public GetIntegrationConfigsQueryHandler(
            IRepository<Domain.Integrations.IntegrationConfig> repository,
            ILogger<GetIntegrationConfigsQueryHandler> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        public async Task<List<IntegrationConfigDto>> Handle(GetIntegrationConfigsQuery request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Getting integration configs. Type: {Type}, IsActive: {IsActive}", 
                request.IntegrationType, request.IsActive);

            var configs = await _repository.FindAsync(
                c => (!request.IntegrationType.HasValue || c.IntegrationType == request.IntegrationType.Value) &&
                     (!request.IsActive.HasValue || c.IsActive == request.IsActive.Value),
                cancellationToken);

            return configs.Select(c => new IntegrationConfigDto
            {
                Id = c.Id,
                IntegrationType = c.IntegrationType,
                Name = c.Name,
                BaseUrl = c.BaseUrl,
                IsActive = c.IsActive,
                TokenExpiresAt = c.TokenExpiresAt,
                IsTokenExpired = c.IsTokenExpired(),
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt ?? c.CreatedAt
            }).ToList();
        }
    }
}

