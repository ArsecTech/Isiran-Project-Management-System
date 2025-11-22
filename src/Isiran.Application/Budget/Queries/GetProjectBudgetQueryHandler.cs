using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Budget.Queries;

public class GetProjectBudgetQueryHandler : IRequestHandler<GetProjectBudgetQuery, ProjectBudgetDto>
{
    private readonly IRepository<Domain.Projects.Project> _projectRepository;
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IRepository<Domain.Tasks.TaskTimeEntry> _timeEntryRepository;
    private readonly ILogger<GetProjectBudgetQueryHandler> _logger;

    public GetProjectBudgetQueryHandler(
        IRepository<Domain.Projects.Project> projectRepository,
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IRepository<Domain.Tasks.TaskTimeEntry> timeEntryRepository,
        ILogger<GetProjectBudgetQueryHandler> logger)
    {
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _timeEntryRepository = timeEntryRepository;
        _logger = logger;
    }

    public async Task<ProjectBudgetDto> Handle(GetProjectBudgetQuery request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project with ID {request.ProjectId} not found.");
        }

        var tasks = await _taskRepository.FindAsync(
            t => t.ProjectId == request.ProjectId && !t.IsDeleted,
            cancellationToken);

        var timeEntries = await _timeEntryRepository.FindAsync(
            te => tasks.Any(t => t.Id == te.TaskId) && !te.IsDeleted,
            cancellationToken);

        var dto = new ProjectBudgetDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            Budget = project.Budget,
            ActualCost = project.ActualCost,
            RemainingBudget = project.Budget - project.ActualCost,
            BudgetUtilization = project.Budget > 0 
                ? (project.ActualCost / project.Budget) * 100 
                : 0
        };

        // Calculate costs by category
        var laborCost = timeEntries
            .Where(te => te.IsBillable)
            .Sum(te => (te.Hours * (te.HourlyRate ?? 0)));

        var taskCost = tasks
            .Where(t => t.ActualCost.HasValue)
            .Sum(t => t.ActualCost!.Value);

        dto.Categories.Add(new BudgetCategoryDto
        {
            Category = "Labor",
            Budgeted = 0, // Would need to calculate from estimated hours
            Actual = laborCost,
            Variance = laborCost
        });

        dto.Categories.Add(new BudgetCategoryDto
        {
            Category = "Tasks",
            Budgeted = tasks.Where(t => t.EstimatedCost.HasValue).Sum(t => t.EstimatedCost!.Value),
            Actual = taskCost,
            Variance = taskCost - tasks.Where(t => t.EstimatedCost.HasValue).Sum(t => t.EstimatedCost!.Value)
        });

        // Cost items
        foreach (var timeEntry in timeEntries.Where(te => te.IsBillable))
        {
            dto.CostItems.Add(new CostItemDto
            {
                Id = timeEntry.Id,
                Description = timeEntry.Description ?? "Time Entry",
                Amount = timeEntry.Hours * (timeEntry.HourlyRate ?? 0),
                Date = timeEntry.Date,
                Type = "Labor"
            });
        }

        return dto;
    }
}

