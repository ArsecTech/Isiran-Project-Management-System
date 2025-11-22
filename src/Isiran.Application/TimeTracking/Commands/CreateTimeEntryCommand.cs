using MediatR;

namespace Isiran.Application.TimeTracking.Commands;

public class CreateTimeEntryCommand : IRequest<Guid>
{
    public Guid TaskId { get; set; }
    public Guid ResourceId { get; set; }
    public DateTime Date { get; set; }
    public decimal Hours { get; set; }
    public string? Description { get; set; }
    public bool IsBillable { get; set; } = true;
    public decimal? HourlyRate { get; set; }
}

