using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class UpdateIntegrationConfigCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public string? ClientId { get; set; }
        public string? ClientSecret { get; set; }
        public bool IsActive { get; set; }
    }
}

