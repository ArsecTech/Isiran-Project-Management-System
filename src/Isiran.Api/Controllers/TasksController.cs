using Isiran.Application.Common.Models;
using Isiran.Application.Tasks.Commands;
using Isiran.Application.Tasks.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<TasksController> _logger;

    public TasksController(IMediator mediator, ILogger<TasksController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<GetTaskListDto>>> GetTasks(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? searchTerm = null,
        [FromQuery] Guid? projectId = null,
        [FromQuery] Domain.Tasks.TaskStatus? status = null,
        [FromQuery] Domain.Tasks.TaskPriority? priority = null)
    {
        var query = new GetTaskListQuery
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            SearchTerm = searchTerm,
            ProjectId = projectId,
            Status = status,
            Priority = priority
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetTaskDto>> GetTask(Guid id)
    {
        var query = new GetTaskQuery { Id = id };
        var result = await _mediator.Send(query);

        if (result == null)
        {
            return NotFound();
        }

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> CreateTask([FromBody] CreateTaskCommand command)
    {
        var taskId = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetTask), new { id = taskId }, taskId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskCommand command)
    {
        command.Id = id;
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("{id}/move")]
    public async Task<IActionResult> MoveTask(Guid id, [FromBody] MoveTaskCommand command)
    {
        command.TaskId = id;
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("{id}/dependencies")]
    public async Task<IActionResult> UpdateDependencies(Guid id, [FromBody] UpdateTaskDependenciesCommand command)
    {
        command.TaskId = id;
        await _mediator.Send(command);
        return NoContent();
    }

    [HttpPost("{id}/progress")]
    public async Task<IActionResult> UpdateTaskProgress(Guid id, [FromBody] UpdateTaskProgressCommand command)
    {
        command.TaskId = id;
        await _mediator.Send(command);
        return NoContent();
    }
}

