using Isiran.Domain.Integrations;
using MediatR;

namespace Isiran.Application.Integrations.Queries
{
    public class GetIntegrationConfigsQuery : IRequest<List<IntegrationConfigDto>>
    {
        public IntegrationType? IntegrationType { get; set; }
        public bool? IsActive { get; set; }
    }

    public class IntegrationConfigDto
    {
        public Guid Id { get; set; }
        public IntegrationType IntegrationType { get; set; }
        public string Name { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? TokenExpiresAt { get; set; }
        public bool IsTokenExpired { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}

