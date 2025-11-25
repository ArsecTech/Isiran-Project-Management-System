using MediatR;

namespace Isiran.Application.Integrations.Queries
{
    public class GetIntegrationConfigQuery : IRequest<IntegrationConfigDto?>
    {
        public Guid Id { get; set; }
    }
}

