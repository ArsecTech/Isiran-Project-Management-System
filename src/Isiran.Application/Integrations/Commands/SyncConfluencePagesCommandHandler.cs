using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncConfluencePagesCommandHandler : IRequestHandler<SyncConfluencePagesCommand, SyncResult>
    {
        private readonly IConfluenceIntegrationService _confluenceService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IRepository<Domain.Projects.Project> _projectRepository;
        private readonly IRepository<ConfluencePage> _confluencePageRepository;
        private readonly IRepository<SyncLog> _syncLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<SyncConfluencePagesCommandHandler> _logger;

        public SyncConfluencePagesCommandHandler(
            IConfluenceIntegrationService confluenceService,
            IRepository<IntegrationConfig> configRepository,
            IRepository<Domain.Projects.Project> projectRepository,
            IRepository<ConfluencePage> confluencePageRepository,
            IRepository<SyncLog> syncLogRepository,
            IUnitOfWork unitOfWork,
            ILogger<SyncConfluencePagesCommandHandler> logger)
        {
            _confluenceService = confluenceService;
            _configRepository = configRepository;
            _projectRepository = projectRepository;
            _confluencePageRepository = confluencePageRepository;
            _syncLogRepository = syncLogRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<SyncResult> Handle(SyncConfluencePagesCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Confluence sync for project {ProjectId}, Space: {SpaceKey}", 
                request.ProjectId, request.SpaceKey);

            var syncLog = new SyncLog
            {
                IntegrationType = IntegrationType.Confluence,
                ProjectId = request.ProjectId,
                Status = SyncStatus.InProgress,
                StartTime = DateTime.UtcNow
            };

            await _syncLogRepository.AddAsync(syncLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            try
            {
                var config = await _configRepository.GetByIdAsync(request.IntegrationConfigId, cancellationToken);
                if (config == null)
                    throw new InvalidOperationException($"Integration config {request.IntegrationConfigId} not found");

                var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
                if (project == null)
                    throw new InvalidOperationException($"Project {request.ProjectId} not found");

                // Get pages from Confluence
                var pages = await _confluenceService.GetPagesAsync(config, request.SpaceKey, null, cancellationToken);
                _logger.LogInformation("Retrieved {Count} pages from Confluence", pages.Count);

                var recordsSynced = 0;
                var existingPages = await _confluencePageRepository.FindAsync(
                    cp => cp.ProjectId == request.ProjectId,
                    cancellationToken);
                var existingPagesList = existingPages.ToList();

                // Sync pages
                foreach (var pageInfo in pages)
                {
                    var existingPage = existingPagesList.FirstOrDefault(p => p.PageId == pageInfo.Id);
                    
                    if (existingPage == null)
                    {
                        // Create new page record
                        var newPage = new ConfluencePage
                        {
                            ProjectId = request.ProjectId,
                            PageId = pageInfo.Id,
                            Title = pageInfo.Title,
                            Content = pageInfo.Content,
                            Url = pageInfo.Url,
                            SpaceKey = pageInfo.SpaceKey
                        };
                        newPage.UpdateContent(pageInfo.Content ?? string.Empty);
                        await _confluencePageRepository.AddAsync(newPage, cancellationToken);
                        recordsSynced++;
                    }
                    else
                    {
                        // Update existing page
                        existingPage.UpdateContent(pageInfo.Content ?? string.Empty);
                        await _confluencePageRepository.UpdateAsync(existingPage, cancellationToken);
                        recordsSynced++;
                    }
                }

                syncLog.MarkAsCompleted(recordsSynced);
                await _syncLogRepository.UpdateAsync(syncLog, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Confluence sync completed. Synced {Count} records", recordsSynced);

                return new SyncResult
                {
                    Success = true,
                    RecordsSynced = recordsSynced,
                    SyncLogId = syncLog.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Confluence sync failed for project {ProjectId}", request.ProjectId);
                syncLog.MarkAsFailed(ex.Message);
                await _syncLogRepository.UpdateAsync(syncLog, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    SyncLogId = syncLog.Id
                };
            }
        }
    }
}

