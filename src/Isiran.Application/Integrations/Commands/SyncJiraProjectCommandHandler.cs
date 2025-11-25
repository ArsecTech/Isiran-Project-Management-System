using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using Isiran.Domain.Tasks;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncJiraProjectCommandHandler : IRequestHandler<SyncJiraProjectCommand, SyncResult>
    {
        private readonly IJiraIntegrationService _jiraService;
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IRepository<Domain.Projects.Project> _projectRepository;
        private readonly IRepository<ProjectTask> _taskRepository;
        private readonly IRepository<JiraProject> _jiraProjectRepository;
        private readonly IRepository<SyncLog> _syncLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<SyncJiraProjectCommandHandler> _logger;

        public SyncJiraProjectCommandHandler(
            IJiraIntegrationService jiraService,
            IRepository<IntegrationConfig> configRepository,
            IRepository<Domain.Projects.Project> projectRepository,
            IRepository<ProjectTask> taskRepository,
            IRepository<JiraProject> jiraProjectRepository,
            IRepository<SyncLog> syncLogRepository,
            IUnitOfWork unitOfWork,
            ILogger<SyncJiraProjectCommandHandler> logger)
        {
            _jiraService = jiraService;
            _configRepository = configRepository;
            _projectRepository = projectRepository;
            _taskRepository = taskRepository;
            _jiraProjectRepository = jiraProjectRepository;
            _syncLogRepository = syncLogRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<SyncResult> Handle(SyncJiraProjectCommand request, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Jira sync for project {ProjectId}, Jira project: {JiraProjectKey}", 
                request.ProjectId, request.JiraProjectKey);

            var syncLog = new SyncLog
            {
                IntegrationType = IntegrationType.Jira,
                ProjectId = request.ProjectId,
                Status = SyncStatus.InProgress,
                StartTime = DateTime.UtcNow
            };

            await _syncLogRepository.AddAsync(syncLog, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            try
            {
                var config = await _configRepository.GetByIdAsync(request.IntegrationConfigId, cancellationToken);
                if (config == null)
                    throw new InvalidOperationException($"Integration config {request.IntegrationConfigId} not found");

                var project = await _projectRepository.GetByIdAsync(request.ProjectId, cancellationToken);
                if (project == null)
                    throw new InvalidOperationException($"Project {request.ProjectId} not found");

                // Get or create JiraProject mapping
                var jiraProjectMapping = await _jiraProjectRepository.FindAsync(
                    jp => jp.ProjectId == request.ProjectId,
                    cancellationToken);

                var jiraProject = jiraProjectMapping.FirstOrDefault();
                if (jiraProject == null)
                {
                    // Get Jira project info
                    var jiraProjects = await _jiraService.GetProjectsAsync(config, cancellationToken);
                    var jiraProjectInfo = jiraProjects.FirstOrDefault(p => p.Key == request.JiraProjectKey);
                    
                    if (jiraProjectInfo == null)
                        throw new InvalidOperationException($"Jira project {request.JiraProjectKey} not found");

                    jiraProject = new JiraProject
                    {
                        ProjectId = request.ProjectId,
                        JiraProjectKey = jiraProjectInfo.Key,
                        JiraProjectId = jiraProjectInfo.Id,
                        JiraProjectName = jiraProjectInfo.Name
                    };
                    await _jiraProjectRepository.AddAsync(jiraProject, cancellationToken);
                }

                // Get issues from Jira
                var jiraIssues = await _jiraService.GetIssuesAsync(config, request.JiraProjectKey, cancellationToken);
                _logger.LogInformation("Retrieved {Count} issues from Jira", jiraIssues.Count);

                var recordsSynced = 0;
                var existingTasks = await _taskRepository.FindAsync(
                    t => t.ProjectId == request.ProjectId,
                    cancellationToken);
                var existingTasksList = existingTasks.ToList();

                // Sync issues to tasks
                foreach (var jiraIssue in jiraIssues)
                {
                    var existingTask = existingTasksList.FirstOrDefault(t => t.JiraIssueKey == jiraIssue.Key);
                    
                    if (existingTask == null)
                    {
                        // Create new task
                        var newTask = new ProjectTask(
                            request.ProjectId,
                            jiraIssue.Summary,
                            TaskType.Task,
                            null,
                            jiraIssue.Created,
                            jiraIssue.DueDate.HasValue ? (int?)(jiraIssue.DueDate.Value - jiraIssue.Created.Value).Days : null,
                            MapPriority(jiraIssue.Priority),
                            jiraIssue.Description);

                        newTask.LinkToJira(jiraIssue.Key, jiraIssue.Id);
                        newTask.ChangeStatus(MapStatus(jiraIssue.Status));
                        
                        if (jiraIssue.DueDate.HasValue)
                        {
                            newTask.UpdateDates(jiraIssue.Created, jiraIssue.DueDate);
                        }

                        await _taskRepository.AddAsync(newTask, cancellationToken);
                        recordsSynced++;
                    }
                    else
                    {
                        // Update existing task
                        existingTask.UpdateDetails(
                            jiraIssue.Summary,
                            jiraIssue.Description,
                            MapPriority(jiraIssue.Priority));

                        var newStatus = MapStatus(jiraIssue.Status);
                        if (existingTask.Status != newStatus)
                        {
                            existingTask.ChangeStatus(newStatus);
                        }

                        if (jiraIssue.DueDate.HasValue && jiraIssue.Created.HasValue)
                        {
                            existingTask.UpdateDates(jiraIssue.Created, jiraIssue.DueDate);
                        }

                        await _taskRepository.UpdateAsync(existingTask, cancellationToken);
                        recordsSynced++;
                    }
                }

                jiraProject.UpdateSyncTime();
                await _jiraProjectRepository.UpdateAsync(jiraProject, cancellationToken);

                syncLog.MarkAsCompleted(recordsSynced);
                await _syncLogRepository.UpdateAsync(syncLog, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Jira sync completed. Synced {Count} records", recordsSynced);

                return new SyncResult
                {
                    Success = true,
                    RecordsSynced = recordsSynced,
                    SyncLogId = syncLog.Id
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Jira sync failed for project {ProjectId}", request.ProjectId);
                syncLog.MarkAsFailed(ex.Message);
                await _syncLogRepository.UpdateAsync(syncLog, cancellationToken);
                await _unitOfWork.SaveChangesAsync(cancellationToken);

                return new SyncResult
                {
                    Success = false,
                    ErrorMessage = ex.Message,
                    SyncLogId = syncLog.Id
                };
            }
        }

        private TaskPriority MapPriority(string? jiraPriority)
        {
            return jiraPriority?.ToLower() switch
            {
                "lowest" or "low" => TaskPriority.Low,
                "medium" => TaskPriority.Medium,
                "high" => TaskPriority.High,
                "highest" or "critical" or "blocker" => TaskPriority.Critical,
                _ => TaskPriority.Medium
            };
        }

        private Domain.Tasks.TaskStatus MapStatus(string jiraStatus)
        {
            return jiraStatus.ToLower() switch
            {
                "to do" or "open" or "new" => Domain.Tasks.TaskStatus.NotStarted,
                "in progress" or "in review" or "in development" => Domain.Tasks.TaskStatus.InProgress,
                "done" or "closed" or "resolved" => Domain.Tasks.TaskStatus.Completed,
                "blocked" or "on hold" => Domain.Tasks.TaskStatus.OnHold,
                "cancelled" or "rejected" => Domain.Tasks.TaskStatus.Cancelled,
                _ => Domain.Tasks.TaskStatus.NotStarted
            };
        }
    }
}

