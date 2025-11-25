namespace Isiran.Application.Export.Services;

public interface IExportService
{
    Task<byte[]> ExportToPdfAsync<T>(List<T> data, string title, CancellationToken cancellationToken = default);
    Task<byte[]> ExportToExcelAsync<T>(List<T> data, string sheetName, CancellationToken cancellationToken = default);
    Task<byte[]> ExportProjectReportToPdfAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<byte[]> ExportProjectReportToExcelAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<byte[]> ExportProjectScheduleToMspAsync(Guid projectId, CancellationToken cancellationToken = default);
}

