using MediatR;

namespace Isiran.Application.Integrations.Commands
{
    public class DeleteIntegrationConfigCommand : IRequest<Unit>
    {
        public Guid Id { get; set; }
    }
}

