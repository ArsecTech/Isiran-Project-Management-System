using Isiran.Application.Integrations.Commands;
using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/integrations/powerbi")]
    [Authorize]
    public class PowerBIController : ControllerBase
    {
        private readonly IPowerBIIntegrationService _powerBIService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<PowerBIController> _logger;

        public PowerBIController(
            IPowerBIIntegrationService powerBIService,
            IRepository<IntegrationConfig> configRepository,
            IUnitOfWork unitOfWork,
            ILogger<PowerBIController> logger)
        {
            _powerBIService = powerBIService;
            _configRepository = configRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        [HttpGet("oauth/authorize")]
        [AllowAnonymous]
        public async Task<ActionResult<string>> GetAuthorizationUrl([FromQuery] string redirectUri, [FromQuery] string? state = null)
        {
            state ??= Guid.NewGuid().ToString();
            var authUrl = await _powerBIService.GetAuthorizationUrlAsync(redirectUri, state);
            return Ok(new { authorizationUrl = authUrl, state });
        }

        [HttpPost("oauth/callback")]
        [AllowAnonymous]
        public async Task<ActionResult<Guid>> OAuthCallback([FromBody] OAuthCallbackRequest request)
        {
            var config = await _configRepository.GetByIdAsync(request.ConfigId);
            if (config == null)
                return NotFound("Integration config not found");

            config = await _powerBIService.ExchangeCodeForTokenAsync(request.Code, request.RedirectUri, config);
            
            await _configRepository.UpdateAsync(config);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { configId = config.Id });
        }

        [HttpGet("workspaces")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<PowerBIWorkspace>>> GetWorkspaces([FromQuery] Guid configId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            if (config.IntegrationType != IntegrationType.PowerBI)
                return BadRequest("Integration config is not for Power BI");

            var workspaces = await _powerBIService.GetWorkspacesAsync(config);
            return Ok(workspaces);
        }

        [HttpGet("reports")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<PowerBIReportInfo>>> GetReports(
            [FromQuery] Guid configId,
            [FromQuery] string? workspaceId = null)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var reports = await _powerBIService.GetReportsAsync(config, workspaceId);
            return Ok(reports);
        }

        [HttpGet("reports/{reportId}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<PowerBIReportInfo>> GetReport([FromQuery] Guid configId, string reportId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var report = await _powerBIService.GetReportAsync(config, reportId);
            
            if (report == null)
                return NotFound("Report not found");

            return Ok(report);
        }

        [HttpGet("reports/{reportId}/embed-token")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<string>> GetEmbedToken(
            [FromQuery] Guid configId,
            string reportId,
            [FromQuery] string? workspaceId = null)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var embedToken = await _powerBIService.GetEmbedTokenAsync(config, reportId, workspaceId);
            return Ok(new { embedToken });
        }

        [HttpPost("sync")]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<ActionResult<SyncResult>> SyncReports([FromBody] SyncReportsRequest request)
        {
            var command = new SyncPowerBIReportsCommand
            {
                ProjectId = request.ProjectId,
                IntegrationConfigId = request.ConfigId,
                WorkspaceId = request.WorkspaceId
            };

            var mediator = HttpContext.RequestServices.GetRequiredService<MediatR.IMediator>();
            var result = await mediator.Send(command);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }

    public class SyncReportsRequest
    {
        public Guid ConfigId { get; set; }
        public Guid? ProjectId { get; set; }
        public string? WorkspaceId { get; set; }
    }
}

