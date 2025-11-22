using Isiran.GanttEngine.Services;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GanttController : ControllerBase
{
    private readonly IGanttCalculationService _ganttService;
    private readonly ILogger<GanttController> _logger;

    public GanttController(IGanttCalculationService ganttService, ILogger<GanttController> logger)
    {
        _ganttService = ganttService;
        _logger = logger;
    }

    [HttpGet("project/{projectId}/schedule")]
    public async Task<ActionResult<GanttCalculationResult>> GetSchedule(Guid projectId)
    {
        var result = await _ganttService.CalculateScheduleAsync(projectId);
        return Ok(result);
    }

    [HttpGet("project/{projectId}/critical-path")]
    public async Task<ActionResult<List<CriticalPathTask>>> GetCriticalPath(Guid projectId)
    {
        var result = await _ganttService.CalculateCriticalPathAsync(projectId);
        return Ok(result);
    }

    [HttpGet("project/{projectId}/resource-allocation")]
    public async Task<ActionResult<ResourceAllocationResult>> GetResourceAllocation(Guid projectId)
    {
        var result = await _ganttService.CalculateResourceAllocationAsync(projectId);
        return Ok(result);
    }
}
