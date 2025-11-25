using Isiran.Application.Tasks.Commands;
using Isiran.Application.Tasks.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers
{
    [ApiController]
    [Route("api/activity-dependencies")]
    [Authorize]
    public class ActivityDependenciesController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<ActivityDependenciesController> _logger;

        public ActivityDependenciesController(IMediator mediator, ILogger<ActivityDependenciesController> logger)
        {
            _mediator = mediator;
            _logger = logger;
        }

        [HttpGet]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<List<ActivityDependencyDto>>> GetDependencies(
            [FromQuery] Guid? projectId,
            [FromQuery] Guid? taskId)
        {
            var query = new GetActivityDependenciesQuery
            {
                ProjectId = projectId,
                TaskId = taskId
            };

            var result = await _mediator.Send(query);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<ActionResult<Guid>> CreateDependency(CreateActivityDependencyCommand command)
        {
            var id = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetDependencies), new { taskId = command.SuccessorActivityId }, id);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator,PMOManager,ProjectManager")]
        public async Task<IActionResult> DeleteDependency(Guid id)
        {
            var command = new DeleteActivityDependencyCommand { Id = id };
            await _mediator.Send(command);
            return NoContent();
        }
    }
}

