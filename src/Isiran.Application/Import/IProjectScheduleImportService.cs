using System.IO;

namespace Isiran.Application.Import;

public interface IProjectScheduleImportService
{
    Task<ProjectScheduleImportResult> ImportFromExcelAsync(Guid projectId, Stream fileStream, CancellationToken cancellationToken = default);
    Task<ProjectScheduleImportResult> ImportFromMspAsync(Guid projectId, Stream fileStream, CancellationToken cancellationToken = default);
}

