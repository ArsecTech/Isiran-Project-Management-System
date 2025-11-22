using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Reporting.Queries;

public class GetProjectReportQueryHandler : IRequestHandler<GetProjectReportQuery, ProjectReportDto>
{
    private readonly IRepository<Domain.Projects.Project> _projectRepository;
    private readonly IRepository<Domain.Tasks.ProjectTask> _taskRepository;
    private readonly IRepository<Domain.Tasks.TaskTimeEntry> _timeEntryRepository;
    private readonly ILogger<GetProjectReportQueryHandler> _logger;

    public GetProjectReportQueryHandler(
        IRepository<Domain.Projects.Project> projectRepository,
        IRepository<Domain.Tasks.ProjectTask> taskRepository,
        IRepository<Domain.Tasks.TaskTimeEntry> timeEntryRepository,
        ILogger<GetProjectReportQueryHandler> logger)
    {
        _projectRepository = projectRepository;
        _taskRepository = taskRepository;
        _timeEntryRepository = timeEntryRepository;
        _logger = logger;
    }

    public async Task<ProjectReportDto> Handle(GetProjectReportQuery request, CancellationToken cancellationToken)
    {
        var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
        if (project == null)
        {
            throw new NotFoundException($"Project with ID {request.ProjectId} not found.");
        }

        var tasks = await _taskRepository.FindAsync(
            t => t.ProjectId == request.ProjectId && !t.IsDeleted,
            cancellationToken);

        var taskList = tasks.ToList();
        var timeEntries = await _timeEntryRepository.FindAsync(
            te => taskList.Any(t => t.Id == te.TaskId) && !te.IsDeleted,
            cancellationToken);

        var report = new ProjectReportDto
        {
            ProjectId = project.Id,
            ProjectName = project.Name,
            Type = request.Type,
            GeneratedAt = DateTime.UtcNow,
            Summary = new ProjectSummaryDto
            {
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                ActualStartDate = project.ActualStartDate,
                ActualEndDate = project.ActualEndDate,
                TotalTasks = taskList.Count,
                CompletedTasks = taskList.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed),
                InProgressTasks = taskList.Count(t => t.Status == Domain.Tasks.TaskStatus.InProgress),
                ProgressPercentage = taskList.Any() 
                    ? (double)taskList.Count(t => t.Status == Domain.Tasks.TaskStatus.Completed) / taskList.Count * 100 
                    : 0,
                Budget = project.Budget,
                ActualCost = project.ActualCost,
                RemainingBudget = project.Budget - project.ActualCost
            }
        };

        // Task details
        foreach (var task in taskList)
        {
            report.Tasks.Add(new TaskReportDto
            {
                Id = task.Id,
                Name = task.Name,
                Status = task.Status.ToString(),
                StartDate = task.StartDate,
                EndDate = task.EndDate,
                PercentComplete = task.PercentComplete,
                AssignedTo = task.AssignedTo?.FullName
            });
        }

        // Resource details
        var resourceGroups = timeEntries
            .GroupBy(te => te.ResourceId)
            .ToList();

        foreach (var group in resourceGroups)
        {
            var resourceEntries = group.ToList();
            report.Resources.Add(new ResourceReportDto
            {
                Id = group.Key,
                Name = "Resource", // Would need to load resource name
                TotalHours = (decimal)resourceEntries.Sum(te => te.Hours),
                BillableHours = (decimal)resourceEntries.Where(te => te.IsBillable).Sum(te => te.Hours),
                Cost = resourceEntries.Sum(te => te.Hours * (te.HourlyRate ?? 0))
            });
        }

        // Cost details
        report.Cost = new CostReportDto
        {
            TotalBudget = project.Budget,
            TotalActual = project.ActualCost,
            TotalEstimated = taskList.Where(t => t.EstimatedCost.HasValue).Sum(t => t.EstimatedCost!.Value),
            Variance = project.ActualCost - project.Budget,
            Categories = new List<CostCategoryDto>
            {
                new CostCategoryDto
                {
                    Category = "Labor",
                    Budgeted = 0,
                    Actual = timeEntries.Where(te => te.IsBillable).Sum(te => te.Hours * (te.HourlyRate ?? 0)),
                    Variance = timeEntries.Where(te => te.IsBillable).Sum(te => te.Hours * (te.HourlyRate ?? 0))
                },
                new CostCategoryDto
                {
                    Category = "Tasks",
                    Budgeted = taskList.Where(t => t.EstimatedCost.HasValue).Sum(t => t.EstimatedCost!.Value),
                    Actual = taskList.Where(t => t.ActualCost.HasValue).Sum(t => t.ActualCost!.Value),
                    Variance = taskList.Where(t => t.ActualCost.HasValue).Sum(t => t.ActualCost!.Value) -
                               taskList.Where(t => t.EstimatedCost.HasValue).Sum(t => t.EstimatedCost!.Value)
                }
            }
        };

        return report;
    }
}

