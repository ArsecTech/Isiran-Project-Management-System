using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Isiran.Api.BackgroundJobs
{
    public class ScheduledJobsService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ScheduledJobsService> _logger;
        private readonly TimeSpan _kpiCalculationInterval = TimeSpan.FromHours(24); // Daily
        private readonly TimeSpan _syncJobInterval = TimeSpan.FromHours(6); // Every 6 hours

        public ScheduledJobsService(
            IServiceProvider serviceProvider,
            ILogger<ScheduledJobsService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Scheduled Jobs Service started");

            // Schedule KPI calculation to run at midnight UTC
            var kpiTask = RunKPICalculationJobAsync(stoppingToken);
            
            // Schedule sync jobs
            var syncTask = RunSyncJobsAsync(stoppingToken);

            await Task.WhenAll(kpiTask, syncTask);
        }

        private async Task RunKPICalculationJobAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var now = DateTime.UtcNow;
                    var nextRun = now.Date.AddDays(1); // Next midnight
                    var delay = nextRun - now;

                    if (delay.TotalMilliseconds > 0)
                    {
                        _logger.LogInformation("Next KPI calculation scheduled for {NextRun}", nextRun);
                        await Task.Delay(delay, stoppingToken);
                    }

                    if (stoppingToken.IsCancellationRequested)
                        break;

                    using var scope = _serviceProvider.CreateScope();
                    var kpiService = scope.ServiceProvider.GetRequiredService<IKPICalculationService>();
                    
                    _logger.LogInformation("Running scheduled KPI calculation");
                    await kpiService.CalculateKPIsForAllActiveProjectsAsync(DateTime.UtcNow.Date, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in KPI calculation job");
                    // Wait 1 hour before retrying
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }
        }

        private async Task RunSyncJobsAsync(CancellationToken stoppingToken)
        {
            // Wait 5 minutes on startup before first sync
            await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var syncJob = scope.ServiceProvider.GetRequiredService<IntegrationSyncJob>();
                    
                    _logger.LogInformation("Running scheduled integration sync jobs");
                    
                    await syncJob.SyncJiraProjectsAsync();
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken); // Small delay between syncs
                    await syncJob.SyncConfluencePagesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in integration sync jobs");
                }

                // Wait 6 hours before next sync
                await Task.Delay(_syncJobInterval, stoppingToken);
            }
        }
    }
}

