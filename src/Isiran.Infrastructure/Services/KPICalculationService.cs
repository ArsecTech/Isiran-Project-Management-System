using Isiran.Core.Interfaces;
using Isiran.Domain.Projects;
using Isiran.Domain.Tasks;
using Microsoft.Extensions.Logging;

namespace Isiran.Infrastructure.Services
{
    public class KPICalculationService : IKPICalculationService
    {
        private readonly IRepository<Project> _projectRepository;
        private readonly IRepository<ProjectTask> _taskRepository;
        private readonly IRepository<KPIMetric> _kpiRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<KPICalculationService> _logger;

        public KPICalculationService(
            IRepository<Project> projectRepository,
            IRepository<ProjectTask> taskRepository,
            IRepository<KPIMetric> kpiRepository,
            IUnitOfWork unitOfWork,
            ILogger<KPICalculationService> logger)
        {
            _projectRepository = projectRepository;
            _taskRepository = taskRepository;
            _kpiRepository = kpiRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<KPIMetric> CalculateKPIsForProjectAsync(Guid projectId, DateTime metricDate, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Calculating KPIs for project {ProjectId} on {MetricDate}", projectId, metricDate);

            var project = await _projectRepository.GetByIdAsync(projectId, cancellationToken);
            if (project == null)
                throw new InvalidOperationException($"Project with ID {projectId} not found.");

            var tasks = await _taskRepository.FindAsync(t => t.ProjectId == projectId, cancellationToken);
            var tasksList = tasks.ToList();

            // Calculate Earned Value (EV) - Budget × PercentComplete
            var totalBudget = project.Budget;
            var totalPercentComplete = CalculateProjectPercentComplete(tasksList);
            var ev = totalBudget * (totalPercentComplete / 100m);

            // Calculate Planned Value (PV) - Budget × (DaysElapsed / TotalDays)
            var projectStartDate = project.StartDate ?? DateTime.UtcNow;
            var projectEndDate = project.EndDate ?? projectStartDate.AddDays(365); // Default to 1 year if not set
            var totalDays = (projectEndDate - projectStartDate).Days;
            var daysElapsed = (metricDate.Date - projectStartDate.Date).Days;
            daysElapsed = Math.Max(0, Math.Min(daysElapsed, totalDays)); // Clamp between 0 and totalDays
            var pv = totalDays > 0 ? totalBudget * (daysElapsed / (decimal)totalDays) : 0;

            // Calculate Actual Cost (AC) - Sum of actual costs from tasks
            var ac = tasksList.Sum(t => t.ActualCost ?? 0);

            // Budget at Completion (BAC) - Total project budget
            var bac = totalBudget;

            // Create KPI Metric
            var kpiMetric = new KPIMetric
            {
                ProjectId = projectId,
                MetricDate = metricDate.Date,
                EV = ev,
                PV = pv,
                AC = ac,
                BAC = bac
            };

            // Calculate derived metrics
            kpiMetric.CalculateAll();

            // Check if metric already exists for this date
            var existingMetric = await _kpiRepository.FindAsync(
                k => k.ProjectId == projectId && k.MetricDate == metricDate.Date,
                cancellationToken);

            if (existingMetric.Any())
            {
                var existing = existingMetric.First();
                existing.EV = kpiMetric.EV;
                existing.PV = kpiMetric.PV;
                existing.AC = kpiMetric.AC;
                existing.BAC = kpiMetric.BAC;
                existing.CalculateAll();
                await _kpiRepository.UpdateAsync(existing, cancellationToken);
                _logger.LogInformation("Updated existing KPI metric for project {ProjectId}", projectId);
            }
            else
            {
                await _kpiRepository.AddAsync(kpiMetric, cancellationToken);
                _logger.LogInformation("Created new KPI metric for project {ProjectId}", projectId);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("KPI calculation completed. CPI: {CPI}, SPI: {SPI}, EV: {EV}, PV: {PV}, AC: {AC}",
                kpiMetric.CPI, kpiMetric.SPI, kpiMetric.EV, kpiMetric.PV, kpiMetric.AC);

            return kpiMetric;
        }

        public async Task<List<KPIMetric>> CalculateKPIsForAllActiveProjectsAsync(DateTime metricDate, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Calculating KPIs for all active projects on {MetricDate}", metricDate);

            var activeProjects = await _projectRepository.FindAsync(
                p => p.Status == Domain.Projects.ProjectStatus.InProgress || 
                     p.Status == Domain.Projects.ProjectStatus.Planning,
                cancellationToken);

            var results = new List<KPIMetric>();
            foreach (var project in activeProjects)
            {
                try
                {
                    var kpi = await CalculateKPIsForProjectAsync(project.Id, metricDate, cancellationToken);
                    results.Add(kpi);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to calculate KPIs for project {ProjectId}", project.Id);
                }
            }

            _logger.LogInformation("Calculated KPIs for {Count} projects", results.Count);
            return results;
        }

        public async Task<KPIMetricDto> GetLatestKPIsAsync(Guid projectId, CancellationToken cancellationToken = default)
        {
            var metrics = await _kpiRepository.FindAsync(
                k => k.ProjectId == projectId,
                cancellationToken);

            var latest = metrics.OrderByDescending(k => k.MetricDate).FirstOrDefault();
            
            if (latest == null)
                throw new InvalidOperationException($"No KPI metrics found for project {projectId}");

            return MapToDto(latest);
        }

        public async Task<List<KPIMetricDto>> GetKPIsHistoryAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default)
        {
            var metrics = await _kpiRepository.FindAsync(
                k => k.ProjectId == projectId &&
                     (!startDate.HasValue || k.MetricDate >= startDate.Value.Date) &&
                     (!endDate.HasValue || k.MetricDate <= endDate.Value.Date),
                cancellationToken);

            return metrics.OrderBy(k => k.MetricDate).Select(MapToDto).ToList();
        }

        private decimal CalculateProjectPercentComplete(List<ProjectTask> tasks)
        {
            if (tasks.Count == 0)
                return 0;

            // Weighted average based on task duration or effort
            var totalWeight = 0m;
            var weightedComplete = 0m;

            foreach (var task in tasks)
            {
                var weight = (decimal)(task.Duration > 0 ? task.Duration : 1);
                totalWeight += weight;
                weightedComplete += weight * (task.PercentComplete ?? 0);
            }

            return totalWeight > 0 ? weightedComplete / totalWeight : 0;
        }

        private KPIMetricDto MapToDto(KPIMetric metric)
        {
            return new KPIMetricDto
            {
                Id = metric.Id,
                ProjectId = metric.ProjectId,
                MetricDate = metric.MetricDate,
                CPI = metric.CPI,
                SPI = metric.SPI,
                EV = metric.EV,
                PV = metric.PV,
                AC = metric.AC,
                BAC = metric.BAC,
                EAC = metric.EAC,
                ETC = metric.ETC,
                VAC = metric.VAC,
                CreatedAt = metric.CreatedAt
            };
        }
    }
}

