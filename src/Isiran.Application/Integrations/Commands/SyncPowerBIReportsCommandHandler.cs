using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncPowerBIReportsCommandHandler : IRequestHandler<SyncPowerBIReportsCommand, SyncResult>
    {
        private readonly IPowerBIIntegrationService _powerBIService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IRepository<PowerBIReport> _powerBIReportRepository;
        private readonly IRepository<SyncLog> _syncLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<SyncPowerBIReportsCommandHandler> _logger;

        public SyncPowerBIReportsCommandHandler(
            IPowerBIIntegrationService powerBIService,
            IRepository<IntegrationConfig> configRepository,
            IRepository<PowerBIReport> powerBIReportRepository,
            IRepository<SyncLog> syncLogRepository,
            IUnitOfWork unitOfWork,
            ILogger<SyncPowerBIReportsCommandHandler> logger)
        {
            _powerBIService = powerBIService;
            _configRepository = configRepository;
            _powerBIReportRepository = powerBIReportRepository;
            _syncLogRepository = syncLogRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<SyncResult> Handle(SyncPowerBIReportsCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Power BI sync. ProjectId: {ProjectId}, WorkspaceId: {WorkspaceId}", 
                request.ProjectId, request.WorkspaceId);

            var syncLog = new SyncLog
            {
                IntegrationType = IntegrationType.PowerBI,
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

                // Get reports from Power BI
                var reports = await _powerBIService.GetReportsAsync(config, request.WorkspaceId, cancellationToken);
                _logger.LogInformation("Retrieved {Count} reports from Power BI", reports.Count);

                var recordsSynced = 0;
                var existingReports = await _powerBIReportRepository.FindAsync(
                    r => (!request.ProjectId.HasValue || r.ProjectId == request.ProjectId),
                    cancellationToken);
                var existingReportsList = existingReports.ToList();

                // Sync reports
                foreach (var reportInfo in reports)
                {
                    var existingReport = existingReportsList.FirstOrDefault(r => r.ReportId == reportInfo.Id);
                    
                    if (existingReport == null)
                    {
                        // Create new report record
                        var newReport = new PowerBIReport
                        {
                            ProjectId = request.ProjectId,
                            ReportId = reportInfo.Id,
                            Name = reportInfo.Name,
                            EmbedUrl = reportInfo.EmbedUrl,
                            WorkspaceId = reportInfo.WorkspaceId,
                            DatasetId = reportInfo.DatasetId
                        };
                        newReport.UpdateSyncTime();
                        await _powerBIReportRepository.AddAsync(newReport, cancellationToken);
                        recordsSynced++;
                    }
                    else
                    {
                        // Update existing report
                        existingReport.UpdateSyncTime();
                        await _powerBIReportRepository.UpdateAsync(existingReport, cancellationToken);
                        recordsSynced++;
                    }
                }

                syncLog.MarkAsCompleted(recordsSynced);
                await _syncLogRepository.UpdateAsync(syncLog, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Power BI sync completed. Synced {Count} records", recordsSynced);

                return new SyncResult
                {
                    Success = true,
                    RecordsSynced = recordsSynced,
                    SyncLogId = syncLog.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Power BI sync failed");
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

