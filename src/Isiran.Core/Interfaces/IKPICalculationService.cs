using Isiran.Domain.Projects;

namespace Isiran.Core.Interfaces
{
    public interface IKPICalculationService
    {
        Task<KPIMetric> CalculateKPIsForProjectAsync(Guid projectId, DateTime metricDate, CancellationToken cancellationToken = default);
        Task<List<KPIMetric>> CalculateKPIsForAllActiveProjectsAsync(DateTime metricDate, CancellationToken cancellationToken = default);
        Task<KPIMetricDto> GetLatestKPIsAsync(Guid projectId, CancellationToken cancellationToken = default);
        Task<List<KPIMetricDto>> GetKPIsHistoryAsync(Guid projectId, DateTime? startDate = null, DateTime? endDate = null, CancellationToken cancellationToken = default);
    }

    public class KPIMetricDto
    {
        public Guid Id { get; set; }
        public Guid ProjectId { get; set; }
        public DateTime MetricDate { get; set; }
        public decimal? CPI { get; set; }
        public decimal? SPI { get; set; }
        public decimal? EV { get; set; }
        public decimal? PV { get; set; }
        public decimal? AC { get; set; }
        public decimal? BAC { get; set; }
        public decimal? EAC { get; set; }
        public decimal? ETC { get; set; }
        public decimal? VAC { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

