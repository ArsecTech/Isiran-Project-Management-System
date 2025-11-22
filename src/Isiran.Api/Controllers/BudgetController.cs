using Isiran.Application.Budget.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<BudgetController> _logger;

    public BudgetController(IMediator mediator, ILogger<BudgetController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<ProjectBudgetDto>> GetProjectBudget(Guid projectId)
    {
        var query = new GetProjectBudgetQuery { ProjectId = projectId };
        var result = await _mediator.Send(query);
        return Ok(result);
    }
}

