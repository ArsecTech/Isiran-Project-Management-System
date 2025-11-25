using Isiran.Application.Integrations.Commands;
using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/integrations/confluence")]
    [Authorize]
    public class ConfluenceController : ControllerBase
    {
        private readonly IConfluenceIntegrationService _confluenceService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ConfluenceController> _logger;

        public ConfluenceController(
            IConfluenceIntegrationService confluenceService,
            IRepository<IntegrationConfig> configRepository,
            IUnitOfWork unitOfWork,
            ILogger<ConfluenceController> logger)
        {
            _confluenceService = confluenceService;
            _configRepository = configRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        [HttpGet("oauth/authorize")]
        [AllowAnonymous]
        public async Task<ActionResult<string>> GetAuthorizationUrl([FromQuery] string redirectUri, [FromQuery] string? state = null)
        {
            state ??= Guid.NewGuid().ToString();
            var authUrl = await _confluenceService.GetAuthorizationUrlAsync(redirectUri, state);
            return Ok(new { authorizationUrl = authUrl, state });
        }

        [HttpPost("oauth/callback")]
        [AllowAnonymous]
        public async Task<ActionResult<Guid>> OAuthCallback([FromBody] OAuthCallbackRequest request)
        {
            var config = await _configRepository.GetByIdAsync(request.ConfigId);
            if (config == null)
                return NotFound("Integration config not found");

            config = await _confluenceService.ExchangeCodeForTokenAsync(request.Code, request.RedirectUri, config);
            
            await _configRepository.UpdateAsync(config);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new { configId = config.Id });
        }

        [HttpGet("spaces")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager,Viewer")]
        public async Task<ActionResult<List<ConfluenceSpace>>> GetSpaces([FromQuery] Guid configId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            if (config.IntegrationType != IntegrationType.Confluence)
                return BadRequest("Integration config is not for Confluence");

            var spaces = await _confluenceService.GetSpacesAsync(config);
            return Ok(spaces);
        }

        [HttpGet("pages")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager,Viewer")]
        public async Task<ActionResult<List<ConfluencePageInfo>>> GetPages(
            [FromQuery] Guid configId,
            [FromQuery] string? spaceKey = null,
            [FromQuery] string? query = null)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var pages = await _confluenceService.GetPagesAsync(config, spaceKey, query);
            return Ok(pages);
        }

        [HttpGet("pages/{pageId}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager,Viewer")]
        public async Task<ActionResult<ConfluencePageInfo>> GetPage([FromQuery] Guid configId, string pageId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var page = await _confluenceService.GetPageAsync(config, pageId);
            
            if (page == null)
                return NotFound("Page not found");

            return Ok(page);
        }

        [HttpGet("pages/{pageId}/content")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager,Viewer")]
        public async Task<ActionResult<string>> GetPageContent([FromQuery] Guid configId, string pageId)
        {
            var config = await _configRepository.GetByIdAsync(configId);
            if (config == null)
                return NotFound("Integration config not found");

            var content = await _confluenceService.GetPageContentAsync(config, pageId);
            return Ok(new { content });
        }

        [HttpPost("sync/{projectId}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<SyncResult>> SyncProjectPages(
            Guid projectId,
            [FromBody] SyncProjectPagesRequest request)
        {
            var command = new SyncConfluencePagesCommand
            {
                ProjectId = projectId,
                IntegrationConfigId = request.ConfigId,
                SpaceKey = request.SpaceKey
            };

            var mediator = HttpContext.RequestServices.GetRequiredService<MediatR.IMediator>();
            var result = await mediator.Send(command);
            
            if (result.Success)
                return Ok(result);
            
            return BadRequest(result);
        }
    }

    public class SyncProjectPagesRequest
    {
        public Guid ConfigId { get; set; }
        public string? SpaceKey { get; set; }
    }
}

