using Isiran.Application.Integrations.Commands;
using Isiran.Core.Interfaces;
using Isiran.Domain.Integrations;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Api.BackgroundJobs
{
    public class IntegrationSyncJob
    {
        private readonly IRepository<IntegrationConfig> _configRepository;
        private readonly IRepository<Domain.Projects.Project> _projectRepository;
        private readonly IRepository<JiraProject> _jiraProjectRepository;
        private readonly IMediator _mediator;
        private readonly ILogger<IntegrationSyncJob> _logger;

        public IntegrationSyncJob(
            IRepository<IntegrationConfig> configRepository,
            IRepository<Domain.Projects.Project> projectRepository,
            IRepository<JiraProject> jiraProjectRepository,
            IMediator mediator,
            ILogger<IntegrationSyncJob> logger)
        {
            _configRepository = configRepository;
            _projectRepository = projectRepository;
            _jiraProjectRepository = jiraProjectRepository;
            _mediator = mediator;
            _logger = logger;
        }

        public async Task SyncJiraProjectsAsync()
        {
            _logger.LogInformation("Starting scheduled Jira sync job");

            try
            {
                var jiraConfigs = await _configRepository.FindAsync(
                    c => c.IntegrationType == IntegrationType.Jira && c.IsActive,
                    CancellationToken.None);

                foreach (var config in jiraConfigs)
                {
                    try
                    {
                        var jiraProjects = await _jiraProjectRepository.FindAsync(
                            jp => true, // Get all mapped projects
                            CancellationToken.None);

                        foreach (var jiraProject in jiraProjects)
                        {
                            var command = new SyncJiraProjectCommand
                            {
                                ProjectId = jiraProject.ProjectId,
                                IntegrationConfigId = config.Id,
                                JiraProjectKey = jiraProject.JiraProjectKey
                            };

                            var result = await _mediator.Send(command);
                            _logger.LogInformation("Synced Jira project {ProjectKey} for project {ProjectId}. Records: {Count}",
                                jiraProject.JiraProjectKey, jiraProject.ProjectId, result.RecordsSynced);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to sync Jira projects for config {ConfigId}", config.Id);
                    }
                }

                _logger.LogInformation("Jira sync job completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Jira sync job failed");
                throw;
            }
        }

        public async Task SyncConfluencePagesAsync()
        {
            _logger.LogInformation("Starting scheduled Confluence sync job");

            try
            {
                var confluenceConfigs = await _configRepository.FindAsync(
                    c => c.IntegrationType == IntegrationType.Confluence && c.IsActive,
                    CancellationToken.None);

                var activeProjects = await _projectRepository.FindAsync(
                    p => p.Status == Domain.Projects.ProjectStatus.InProgress ||
                         p.Status == Domain.Projects.ProjectStatus.Planning,
                    CancellationToken.None);

                foreach (var config in confluenceConfigs)
                {
                    foreach (var project in activeProjects)
                    {
                        try
                        {
                            var command = new SyncConfluencePagesCommand
                            {
                                ProjectId = project.Id,
                                IntegrationConfigId = config.Id,
                                SpaceKey = null // Sync all spaces
                            };

                            var result = await _mediator.Send(command);
                            _logger.LogInformation("Synced Confluence pages for project {ProjectId}. Records: {Count}",
                                project.Id, result.RecordsSynced);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Failed to sync Confluence pages for project {ProjectId}", project.Id);
                        }
                    }
                }

                _logger.LogInformation("Confluence sync job completed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Confluence sync job failed");
                throw;
            }
        }
    }
}

