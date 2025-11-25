using Isiran.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/kpi")]
    [Authorize]
    public class KPIController : ControllerBase
    {
        private readonly IKPICalculationService _kpiService;
        private readonly ILogger<KPIController> _logger;

        public KPIController(
            IKPICalculationService kpiService,
            ILogger<KPIController> logger)
        {
            _kpiService = kpiService;
            _logger = logger;
        }

        [HttpGet("projects/{projectId}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<KPIMetricDto>> GetLatestKPIs(Guid projectId)
        {
            try
            {
                var kpis = await _kpiService.GetLatestKPIsAsync(projectId);
                return Ok(kpis);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("projects/{projectId}/history")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<KPIMetricDto>>> GetKPIsHistory(
            Guid projectId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            var history = await _kpiService.GetKPIsHistoryAsync(projectId, startDate, endDate);
            return Ok(history);
        }

        [HttpPost("projects/{projectId}/calculate")]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<ActionResult<KPIMetricDto>> CalculateKPIs(
            Guid projectId,
            [FromQuery] DateTime? metricDate = null)
        {
            var date = metricDate ?? DateTime.UtcNow.Date;
            var kpi = await _kpiService.CalculateKPIsForProjectAsync(projectId, date);
            
            return Ok(new KPIMetricDto
            {
                Id = kpi.Id,
                ProjectId = kpi.ProjectId,
                MetricDate = kpi.MetricDate,
                CPI = kpi.CPI,
                SPI = kpi.SPI,
                EV = kpi.EV,
                PV = kpi.PV,
                AC = kpi.AC,
                BAC = kpi.BAC,
                EAC = kpi.EAC,
                ETC = kpi.ETC,
                VAC = kpi.VAC,
                CreatedAt = kpi.CreatedAt
            });
        }

        [HttpPost("calculate-all")]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<ActionResult> CalculateAllKPIs([FromQuery] DateTime? metricDate = null)
        {
            var date = metricDate ?? DateTime.UtcNow.Date;
            var results = await _kpiService.CalculateKPIsForAllActiveProjectsAsync(date);
            
            return Ok(new { 
                message = $"Calculated KPIs for {results.Count} projects",
                count = results.Count 
            });
        }
    }
}

