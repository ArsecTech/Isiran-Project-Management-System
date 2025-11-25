using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Isiran.Api.Controllers;

public class ProjectScheduleImportRequest
{
    [Required]
    public IFormFile File { get; set; } = null!;
}

