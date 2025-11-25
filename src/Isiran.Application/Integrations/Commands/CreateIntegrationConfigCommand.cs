using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class CreateIntegrationConfigCommand : IRequest<Guid>
    {
        public Domain.Integrations.IntegrationType IntegrationType { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public bool IsActive { get; set; } = true;
    }
}

