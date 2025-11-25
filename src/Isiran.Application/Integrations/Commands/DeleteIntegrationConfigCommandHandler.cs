using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class DeleteIntegrationConfigCommandHandler : IRequestHandler<DeleteIntegrationConfigCommand, Unit>
    {
        private readonly IRepository<Domain.Integrations.IntegrationConfig> _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<DeleteIntegrationConfigCommandHandler> _logger;

        public DeleteIntegrationConfigCommandHandler(
            IRepository<Domain.Integrations.IntegrationConfig> repository,
            IUnitOfWork unitOfWork,
            ILogger<DeleteIntegrationConfigCommandHandler> logger)
        {
            _repository = repository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteIntegrationConfigCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Deleting integration config: {Id}", request.Id);

            var config = await _repository.GetByIdAsync(request.Id, cancellationToken);
            if (config == null)
                throw new InvalidOperationException($"Integration config with ID {request.Id} not found.");

            await _repository.DeleteAsync(config, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Integration config deleted: {Id}", request.Id);
            return Unit.Value;
        }
    }
}

