using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class CreateIntegrationConfigCommandHandler : IRequestHandler<CreateIntegrationConfigCommand, Guid>
    {
        private readonly IRepository<Domain.Integrations.IntegrationConfig> _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<CreateIntegrationConfigCommandHandler> _logger;

        public CreateIntegrationConfigCommandHandler(
            IRepository<Domain.Integrations.IntegrationConfig> repository,
            IUnitOfWork unitOfWork,
            ILogger<CreateIntegrationConfigCommandHandler> logger)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Guid> Handle(CreateIntegrationConfigCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Creating integration config: {Name}, Type: {Type}", request.Name, request.IntegrationType);

            var config = new Domain.Integrations.IntegrationConfig
            {
                IntegrationType = request.IntegrationType,
                Name = request.Name,
                BaseUrl = request.BaseUrl,
                ClientId = request.ClientId,
                ClientSecret = request.ClientSecret, // Should be encrypted in production
                IsActive = request.IsActive
            };

            await _repository.AddAsync(config, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Integration config created with ID: {Id}", config.Id);
            return config.Id;
        }
    }
}

