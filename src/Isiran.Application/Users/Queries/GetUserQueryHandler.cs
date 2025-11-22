using AutoMapper;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Users.Queries;

public class GetUserQueryHandler : IRequestHandler<GetUserQuery, GetUserDto?>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetUserQueryHandler> _logger;

    public GetUserQueryHandler(
        IUserRepository userRepository,
        IMapper mapper,
        ILogger<GetUserQueryHandler> logger)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<GetUserDto?> Handle(GetUserQuery request, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (user == null)
        {
            return null;
        }

        var roles = await _userRepository.GetUserRolesAsync(user.Id, cancellationToken);
        var dto = _mapper.Map<GetUserDto>(user);
        dto.Roles = roles;

        return dto;
    }
}

