using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class UpdateIntegrationConfigCommandHandler : IRequestHandler<UpdateIntegrationConfigCommand, Unit>
    {
        private readonly IRepository<Domain.Integrations.IntegrationConfig> _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<UpdateIntegrationConfigCommandHandler> _logger;

        public UpdateIntegrationConfigCommandHandler(
            IRepository<Domain.Integrations.IntegrationConfig> repository,
            IUnitOfWork unitOfWork,
            ILogger<UpdateIntegrationConfigCommandHandler> logger)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Unit> Handle(UpdateIntegrationConfigCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Updating integration config: {Id}", request.Id);

            var config = await _repository.GetByIdAsync(request.Id, cancellationToken);
            if (config == null)
                throw new InvalidOperationException($"Integration config with ID {request.Id} not found.");

            config.UpdateDetails(
                request.Name,
                request.BaseUrl,
                request.ClientId,
                string.IsNullOrEmpty(request.ClientSecret) ? null : request.ClientSecret,
                request.IsActive);

            await _repository.UpdateAsync(config, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Integration config updated: {Id}", request.Id);
            return Unit.Value;
        }
    }
}

