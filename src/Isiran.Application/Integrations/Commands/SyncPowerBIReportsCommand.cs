using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class SyncPowerBIReportsCommand : IRequest<SyncResult>
    {
        public Guid? ProjectId { get; set; }
        public Guid IntegrationConfigId { get; set; }
        public string? WorkspaceId { get; set; }
    }
}

