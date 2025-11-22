using MediatR;

namespace Isiran.Application.Budget.Queries;

public class GetProjectBudgetQuery : IRequest<ProjectBudgetDto>
{
    public Guid ProjectId { get; set; }
}

public class ProjectBudgetDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public decimal Budget { get; set; }
    public decimal ActualCost { get; set; }
    public decimal RemainingBudget { get; set; }
    public decimal BudgetUtilization { get; set; }
    public List<BudgetCategoryDto> Categories { get; set; } = new();
    public List<CostItemDto> CostItems { get; set; } = new();
}

public class BudgetCategoryDto
{
    public string Category { get; set; } = string.Empty;
    public decimal Budgeted { get; set; }
    public decimal Actual { get; set; }
    public decimal Variance { get; set; }
}

public class CostItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty;
}

