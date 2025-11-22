using Isiran.Application.Common.Models;
using Isiran.Application.TimeTracking.Commands;
using Isiran.Application.TimeTracking.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TimeTrackingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TimeTrackingController> _logger;

    public TimeTrackingController(IMediator mediator, ILogger<TimeTrackingController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<GetTimeEntryListDto>>> GetTimeEntries(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? taskId = null,
        [FromQuery] Guid? resourceId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var query = new GetTimeEntryListQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TaskId = taskId,
            ResourceId = resourceId,
            StartDate = startDate,
            EndDate = endDate
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateTimeEntry([FromBody] CreateTimeEntryCommand command)
    {
        var timeEntryId = await _mediator.Send(command);
        return CreatedAtAction(nameof(CreateTimeEntry), new { id = timeEntryId }, timeEntryId);
    }
}

