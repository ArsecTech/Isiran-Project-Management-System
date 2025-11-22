using Isiran.GanttEngine.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CriticalPathController : ControllerBase
{
    private readonly IEnhancedCriticalPathService _criticalPathService;
    private readonly IResourceLevelingService _resourceLevelingService;
    private readonly ILogger<CriticalPathController> _logger;

    public CriticalPathController(
        IEnhancedCriticalPathService criticalPathService,
        IResourceLevelingService resourceLevelingService,
        ILogger<CriticalPathController> logger)
    {
        _criticalPathService = criticalPathService;
        _resourceLevelingService = resourceLevelingService;
        _logger = logger;
    }

    [HttpGet("project/{projectId}/analysis")]
    public async Task<ActionResult<CriticalPathAnalysis>> GetCriticalPathAnalysis(Guid projectId)
    {
        var result = await _criticalPathService.AnalyzeCriticalPathAsync(projectId);
        return Ok(result);
    }

    [HttpPost("project/{projectId}/level-resources")]
    public async Task<ActionResult<ResourceLevelingResult>> LevelResources(Guid projectId)
    {
        var result = await _resourceLevelingService.LevelResourcesAsync(projectId);
        return Ok(result);
    }
}

