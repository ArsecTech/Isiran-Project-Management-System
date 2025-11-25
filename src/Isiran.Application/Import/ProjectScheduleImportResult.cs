using System.Collections.Generic;

namespace Isiran.Application.Import;

public class ProjectScheduleImportResult
{
    public Guid ProjectId { get; set; }
    public int ActivitiesFound { get; set; }
    public int ActivitiesWithSchedule { get; set; }
    public List<string> Warnings { get; set; } = new();
}

