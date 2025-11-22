using AutoMapper;
using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Users.Queries;

public class GetUserListQueryHandler : IRequestHandler<GetUserListQuery, PagedResult<GetUserListDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetUserListQueryHandler> _logger;

    public GetUserListQueryHandler(
        IUserRepository userRepository,
        IMapper mapper,
        ILogger<GetUserListQueryHandler> logger)
    {
        _userRepository = userRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<GetUserListDto>> Handle(GetUserListQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.FindAsync(u =>
            !u.IsDeleted &&
            (string.IsNullOrEmpty(request.SearchTerm) ||
             u.Username.Contains(request.SearchTerm) ||
             u.Email.Contains(request.SearchTerm) ||
             u.FirstName.Contains(request.SearchTerm) ||
             u.LastName.Contains(request.SearchTerm)) &&
            (!request.IsActive.HasValue || u.IsActive == request.IsActive.Value),
            cancellationToken);

        var totalCount = users.Count();
        var pagedUsers = users
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = new List<GetUserListDto>();

        foreach (var user in pagedUsers)
        {
            var roles = await _userRepository.GetUserRolesAsync(user.Id, cancellationToken);
            dtos.Add(new GetUserListDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                FullName = user.FullName,
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt,
                Roles = roles
            });
        }

        return new PagedResult<GetUserListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

