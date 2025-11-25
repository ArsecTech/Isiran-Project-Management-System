using Microsoft.Extensions.Logging;
using System.Globalization;
using System.Text;
using System.Xml.Linq;

namespace Isiran.Application.Import;

public class ProjectScheduleImportService : IProjectScheduleImportService
{
    private readonly ILogger<ProjectScheduleImportService> _logger;

    public ProjectScheduleImportService(ILogger<ProjectScheduleImportService> logger)
    {
        _logger = logger;
    }

    public async Task<ProjectScheduleImportResult> ImportFromExcelAsync(Guid projectId, Stream fileStream, CancellationToken cancellationToken = default)
    {
        using var reader = new StreamReader(fileStream, Encoding.UTF8, leaveOpen: true);
        var content = await reader.ReadToEndAsync(cancellationToken);

        var lines = content
            .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
            .ToList();

        var result = new ProjectScheduleImportResult { ProjectId = projectId };

        if (lines.Count <= 1)
        {
            result.Warnings.Add("هیچ ردیفی در فایل اکسل (CSV) یافت نشد.");
            return result;
        }

        var headers = ParseCsvLine(lines[0]);
        var startDateIndex = Array.FindIndex(headers, h => h.Equals("StartDate", StringComparison.OrdinalIgnoreCase));
        var endDateIndex = Array.FindIndex(headers, h => h.Equals("EndDate", StringComparison.OrdinalIgnoreCase));

        for (var i = 1; i < lines.Count; i++)
        {
            var columns = ParseCsvLine(lines[i]);
            if (columns.Length == 0) continue;

            result.ActivitiesFound++;

            var hasSchedule = false;

            if (startDateIndex >= 0 && startDateIndex < columns.Length)
            {
                hasSchedule |= DateTime.TryParse(columns[startDateIndex], CultureInfo.InvariantCulture, out _);
            }

            if (endDateIndex >= 0 && endDateIndex < columns.Length)
            {
                hasSchedule |= DateTime.TryParse(columns[endDateIndex], CultureInfo.InvariantCulture, out _);
            }

            if (hasSchedule)
            {
                result.ActivitiesWithSchedule++;
            }
        }

        return result;
    }

    public async Task<ProjectScheduleImportResult> ImportFromMspAsync(Guid projectId, Stream fileStream, CancellationToken cancellationToken = default)
    {
        var document = await XDocument.LoadAsync(fileStream, LoadOptions.None, cancellationToken);
        var result = new ProjectScheduleImportResult { ProjectId = projectId };

        var tasks = document
            .Descendants("Task")
            .ToList();

        result.ActivitiesFound = tasks.Count;

        foreach (var task in tasks)
        {
            var start = task.Element("Start")?.Value;
            var finish = task.Element("Finish")?.Value;

            if (DateTime.TryParse(start, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _) ||
                DateTime.TryParse(finish, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out _))
            {
                result.ActivitiesWithSchedule++;
            }
        }

        if (result.ActivitiesFound == 0)
        {
            result.Warnings.Add("هیچ گره Task در فایل MSP یافت نشد.");
        }

        return result;
    }

    private static string[] ParseCsvLine(string line)
    {
        if (string.IsNullOrWhiteSpace(line))
        {
            return Array.Empty<string>();
        }

        var values = new List<string>();
        var current = new StringBuilder();
        var insideQuotes = false;

        foreach (var ch in line)
        {
            switch (ch)
            {
                case '"' when insideQuotes:
                    insideQuotes = false;
                    break;
                case '"' when !insideQuotes:
                    insideQuotes = true;
                    break;
                case ',' when !insideQuotes:
                    values.Add(current.ToString());
                    current.Clear();
                    break;
                default:
                    current.Append(ch);
                    break;
            }
        }

        values.Add(current.ToString());

        return values
            .Select(v => v.Replace("\"\"", "\"").Trim())
            .ToArray();
    }
}

