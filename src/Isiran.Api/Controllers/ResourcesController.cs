using Isiran.Application.Common.Models;
using Isiran.Application.Resources.Commands;
using Isiran.Application.Resources.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<ResourcesController> _logger;

    public ResourcesController(IMediator mediator, ILogger<ResourcesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<GetResourceListDto>>> GetResources(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Domain.Resources.ResourceType? type = null,
        [FromQuery] Domain.Resources.ResourceStatus? status = null)
    {
        var query = new GetResourceListQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            Type = type,
            Status = status
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetResourceDto>> GetResource(Guid id)
    {
        var query = new GetResourceQuery { Id = id };
        var result = await _mediator.Send(query);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateResource([FromBody] CreateResourceCommand command)
    {
        var resourceId = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetResource), new { id = resourceId }, resourceId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateResource(Guid id, [FromBody] UpdateResourceCommand command)
    {
        command.Id = id;
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResource(Guid id)
    {
        var command = new DeleteResourceCommand { Id = id };
        await _mediator.Send(command);
        return NoContent();
    }
}

