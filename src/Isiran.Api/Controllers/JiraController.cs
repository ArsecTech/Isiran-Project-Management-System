using Isiran.Application.Integrations.Commands;
using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/integrations/jira")]
    [Authorize]
    public class JiraController : ControllerBase
    {
        private readonly IJiraIntegrationService _jiraService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMediator _mediator;
        private readonly ILogger<JiraController> _logger;

        public JiraController(
            IJiraIntegrationService jiraService,
            IRepository<IntegrationConfig> configRepository,
            IUnitOfWork unitOfWork,
            IMediator mediator,
            ILogger<JiraController> logger)
        {
            _jiraService = jiraService;
            _configRepository = configRepository;
            _unitOfWork = unitOfWork;
            _mediator = mediator;
            _logger = logger;
        }

        [HttpGet("oauth/authorize")]
        [AllowAnonymous]
        public async Task<ActionResult<string>> GetAuthorizationUrl([FromQuery] string redirectUri, [FromQuery] string? state = null)
        {
            state ??= Guid.NewGuid().ToString();
            var authUrl = await _jiraService.GetAuthorizationUrlAsync(redirectUri, state);
            return Ok(new { authorizationUrl = authUrl, state });
        }

        [HttpPost("oauth/callback")]
        [AllowAnonymous]
        public async Task<ActionResult<Guid>> OAuthCallback([FromBody] OAuthCallbackRequest request)
        {
            var config = await _configRepository.GetByIdAsync(request.ConfigId);
            if (config == null)
                return NotFound("Integration config not found");

            config = await _jiraService.ExchangeCodeForTokenAsync(request.Code, request.RedirectUri, config);
            
            await _configRepository.UpdateAsync(config);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { configId = config.Id });
        }

        [HttpGet("projects")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<JiraProjectInfo>>> GetProjects([FromQuery] Guid configId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            if (config.IntegrationType != IntegrationType.Jira)
                return BadRequest("Integration config is not for Jira");

            var projects = await _jiraService.GetProjectsAsync(config);
            return Ok(projects);
        }

        [HttpGet("issues")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<JiraIssue>>> GetIssues([FromQuery] Guid configId, [FromQuery] string projectKey)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var issues = await _jiraService.GetIssuesAsync(config, projectKey);
            return Ok(issues);
        }

        [HttpPost("sync/{projectId}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<SyncResult>> SyncProject(Guid projectId, [FromBody] SyncProjectRequest request)
        {
            var command = new SyncJiraProjectCommand
            {
                ProjectId = projectId,
                IntegrationConfigId = request.ConfigId,
                JiraProjectKey = request.JiraProjectKey
            };

            var result = await _mediator.Send(command);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }

    public class OAuthCallbackRequest
    {
        public Guid ConfigId { get; set; }
        public string Code { get; set; } = string.Empty;
        public string RedirectUri { get; set; } = string.Empty;
    }

    public class SyncProjectRequest
    {
        public Guid ConfigId { get; set; }
        public string JiraProjectKey { get; set; } = string.Empty;
    }
}

