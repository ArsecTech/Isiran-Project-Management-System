using Isiran.Application.Export.Services;
using Isiran.Application.Reporting.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Isiran.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IExportService _exportService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        IMediator mediator,
        IExportService exportService,
        ILogger<ReportsController> logger)
    {
        _mediator = mediator;
        _exportService = exportService;
        _logger = logger;
    }

    [HttpGet("project/{projectId}")]
    public async Task<ActionResult<ProjectReportDto>> GetProjectReport(
        Guid projectId,
        [FromQuery] ReportType type = ReportType.Summary)
    {
        var query = new GetProjectReportQuery { ProjectId = projectId, Type = type };
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("project/{projectId}/export/pdf")]
    public async Task<IActionResult> ExportProjectReportToPdf(Guid projectId)
    {
        var pdfBytes = await _exportService.ExportProjectReportToPdfAsync(projectId);
        return File(pdfBytes, "application/pdf", $"ProjectReport_{projectId}_{DateTime.UtcNow:yyyyMMdd}.pdf");
    }

    [HttpGet("project/{projectId}/export/excel")]
    public async Task<IActionResult> ExportProjectReportToExcel(Guid projectId)
    {
        var excelBytes = await _exportService.ExportProjectReportToExcelAsync(projectId);
        return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
            $"ProjectReport_{projectId}_{DateTime.UtcNow:yyyyMMdd}.xlsx");
    }
}

