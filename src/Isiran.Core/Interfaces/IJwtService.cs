using Isiran.Domain.Users;
using System.Security.Claims;

namespace Isiran.Core.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user, List<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    DateTime GetRefreshTokenExpiryTime();
}

