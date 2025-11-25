using Isiran.Core.Interfaces;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Tasks.Commands
{
    public class DeleteActivityDependencyCommandHandler : IRequestHandler<DeleteActivityDependencyCommand, Unit>
    {
        private readonly IRepository<ActivityDependency> _dependencyRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<DeleteActivityDependencyCommandHandler> _logger;

        public DeleteActivityDependencyCommandHandler(
            IRepository<ActivityDependency> dependencyRepository,
            IUnitOfWork unitOfWork,
            ILogger<DeleteActivityDependencyCommandHandler> logger)
        {
            _dependencyRepository = dependencyRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<Unit> Handle(DeleteActivityDependencyCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Deleting activity dependency: {Id}", request.Id);

            var dependency = await _dependencyRepository.GetByIdAsync(request.Id, cancellationToken);
            if (dependency == null)
                throw new InvalidOperationException($"Activity dependency {request.Id} not found");

            await _dependencyRepository.DeleteAsync(dependency, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Activity dependency deleted: {Id}", request.Id);
            return Unit.Value;
        }
    }
}

