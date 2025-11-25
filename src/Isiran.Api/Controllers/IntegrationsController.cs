using Isiran.Application.Integrations.Commands;
using Isiran.Application.Integrations.Queries;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class IntegrationsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<IntegrationsController> _logger;

        public IntegrationsController(IMediator mediator, ILogger<IntegrationsController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<IntegrationConfigDto>>> GetIntegrations(
            [FromQuery] IntegrationType? integrationType,
            [FromQuery] bool? isActive)
        {
            var query = new GetIntegrationConfigsQuery
            {
                IntegrationType = integrationType,
                IsActive = isActive
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<IntegrationConfigDto>> GetIntegration(Guid id)
        {
            var query = new GetIntegrationConfigQuery { Id = id };
            var result = await _mediator.Send(query);
            
            if (result == null)
                return NotFound();

            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<ActionResult<Guid>> CreateIntegration(CreateIntegrationConfigCommand command)
        {
            var id = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetIntegration), new { id }, id);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<IActionResult> UpdateIntegration(Guid id, UpdateIntegrationConfigCommand command)
        {
            if (id != command.Id)
                return BadRequest();

            await _mediator.Send(command);
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,PMOManager")]
        public async Task<IActionResult> DeleteIntegration(Guid id)
        {
            var command = new DeleteIntegrationConfigCommand { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }
    }
}

