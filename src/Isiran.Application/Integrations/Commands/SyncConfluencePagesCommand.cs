using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncConfluencePagesCommand : IRequest<SyncResult>
    {
        public Guid ProjectId { get; set; }
        public Guid IntegrationConfigId { get; set; }
        public string? SpaceKey { get; set; }
    }
}

