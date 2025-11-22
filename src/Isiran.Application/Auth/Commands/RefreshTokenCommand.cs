using MediatR;

namespace Isiran.Application.Auth.Commands;

public class RefreshTokenCommand : IRequest<LoginResponse>
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

