using Isiran.Application.Common.Models;
using Isiran.Application.Organizations.Commands;
using Isiran.Application.Organizations.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrganizationsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrganizationsController> _logger;

    public OrganizationsController(IMediator mediator, ILogger<OrganizationsController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<GetOrganizationDto>>> GetOrganizations(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? parentOrganizationId = null,
        [FromQuery] bool? isActive = null)
    {
        var query = new GetOrganizationListQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            ParentOrganizationId = parentOrganizationId,
            IsActive = isActive
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("tree")]
    public async Task<ActionResult<List<OrganizationTreeNodeDto>>> GetOrganizationTree()
    {
        var query = new GetOrganizationTreeQuery();
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateOrganization([FromBody] CreateOrganizationCommand command)
    {
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetOrganizations), new { id }, id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateOrganization(Guid id, [FromBody] UpdateOrganizationCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest("ID mismatch");
        }

        await _mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteOrganization(Guid id)
    {
        var command = new DeleteOrganizationCommand { Id = id };
        await _mediator.Send(command);
        return NoContent();
    }
}

