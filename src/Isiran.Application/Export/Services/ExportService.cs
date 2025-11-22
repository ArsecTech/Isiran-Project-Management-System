using Isiran.Application.Reporting.Queries;
using MediatR;
using Microsoft.Extensions.Logging;
using System.Text;

namespace Isiran.Application.Export.Services;

public class ExportService : IExportService
{
    private readonly IMediator _mediator;
    private readonly ILogger<ExportService> _logger;

    public ExportService(IMediator mediator, ILogger<ExportService> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<byte[]> ExportToPdfAsync<T>(List<T> data, string title, CancellationToken cancellationToken = default)
    {
        // Simplified PDF export - in production, use a library like iTextSharp or QuestPDF
        _logger.LogInformation("Exporting {Count} items to PDF: {Title}", data.Count, title);
        
        var html = GenerateHtmlTable(data, title);
        // Convert HTML to PDF using a library
        // For now, return a simple text representation
        return Encoding.UTF8.GetBytes($"PDF Export: {title}\n{data.Count} items");
    }

    public async Task<byte[]> ExportToExcelAsync<T>(List<T> data, string sheetName, CancellationToken cancellationToken = default)
    {
        // Simplified Excel export - in production, use EPPlus or ClosedXML
        _logger.LogInformation("Exporting {Count} items to Excel: {SheetName}", data.Count, sheetName);
        
        // Generate CSV format (can be opened in Excel)
        var csv = GenerateCsv(data);
        return Encoding.UTF8.GetBytes(csv);
    }

    public async Task<byte[]> ExportProjectReportToPdfAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var query = new GetProjectReportQuery { ProjectId = projectId, Type = ReportType.Detailed };
        var report = await _mediator.Send(query, cancellationToken);
        
        return await ExportToPdfAsync(new List<ProjectReportDto> { report }, $"Project Report - {report.ProjectName}", cancellationToken);
    }

    public async Task<byte[]> ExportProjectReportToExcelAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var query = new GetProjectReportQuery { ProjectId = projectId, Type = ReportType.Detailed };
        var report = await _mediator.Send(query, cancellationToken);
        
        // Export tasks to Excel
        var tasks = report.Tasks.Select(t => new
        {
            t.Name,
            t.Status,
            StartDate = t.StartDate?.ToString("yyyy-MM-dd"),
            EndDate = t.EndDate?.ToString("yyyy-MM-dd"),
            t.PercentComplete,
            t.AssignedTo
        }).ToList();
        
        return await ExportToExcelAsync(tasks, "Project Tasks", cancellationToken);
    }

    private string GenerateHtmlTable<T>(List<T> data, string title)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"<h1>{title}</h1>");
        sb.AppendLine("<table border='1'>");
        
        if (data.Any())
        {
            // Get properties
            var properties = typeof(T).GetProperties();
            
            // Header
            sb.AppendLine("<tr>");
            foreach (var prop in properties)
            {
                sb.AppendLine($"<th>{prop.Name}</th>");
            }
            sb.AppendLine("</tr>");
            
            // Rows
            foreach (var item in data)
            {
                sb.AppendLine("<tr>");
                foreach (var prop in properties)
                {
                    var value = prop.GetValue(item)?.ToString() ?? "";
                    sb.AppendLine($"<td>{value}</td>");
                }
                sb.AppendLine("</tr>");
            }
        }
        
        sb.AppendLine("</table>");
        return sb.ToString();
    }

    private string GenerateCsv<T>(List<T> data)
    {
        var sb = new StringBuilder();
        
        if (data.Any())
        {
            var properties = typeof(T).GetProperties();
            
            // Header
            sb.AppendLine(string.Join(",", properties.Select(p => p.Name)));
            
            // Rows
            foreach (var item in data)
            {
                var values = properties.Select(p =>
                {
                    var value = p.GetValue(item)?.ToString() ?? "";
                    // Escape commas and quotes
                    if (value.Contains(",") || value.Contains("\""))
                    {
                        value = $"\"{value.Replace("\"", "\"\"")}\"";
                    }
                    return value;
                });
                sb.AppendLine(string.Join(",", values));
            }
        }
        
        return sb.ToString();
    }
}

