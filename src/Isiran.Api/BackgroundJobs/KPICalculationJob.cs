using Isiran.Core.Interfaces;
using Microsoft.Extensions.Logging;

namespace Isiran.Api.BackgroundJobs
{
    public class KPICalculationJob
    {
        private readonly IKPICalculationService _kpiService;
        private readonly ILogger<KPICalculationJob> _logger;

        public KPICalculationJob(
            IKPICalculationService kpiService,
            ILogger<KPICalculationJob> logger)
        {
            _kpiService = kpiService;
            _logger = logger;
        }

        public async Task ExecuteAsync()
        {
            _logger.LogInformation("Starting scheduled KPI calculation job");

            try
            {
                var metricDate = DateTime.UtcNow.Date;
                var results = await _kpiService.CalculateKPIsForAllActiveProjectsAsync(metricDate);

                _logger.LogInformation("KPI calculation job completed. Calculated KPIs for {Count} projects", results.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "KPI calculation job failed");
                throw;
            }
        }
    }
}

