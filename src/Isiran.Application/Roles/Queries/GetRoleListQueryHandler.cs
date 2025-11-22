using AutoMapper;
using Isiran.Application.Common.Models;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Roles.Queries;

public class GetRoleListQueryHandler : IRequestHandler<GetRoleListQuery, PagedResult<GetRoleListDto>>
{
    private readonly IRepository<Domain.Users.Role> _roleRepository;
    private readonly IRepository<Domain.Users.UserRole> _userRoleRepository;
    private readonly IRepository<Domain.Users.RolePermission> _rolePermissionRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GetRoleListQueryHandler> _logger;

    public GetRoleListQueryHandler(
        IRepository<Domain.Users.Role> roleRepository,
        IRepository<Domain.Users.UserRole> userRoleRepository,
        IRepository<Domain.Users.RolePermission> rolePermissionRepository,
        IMapper mapper,
        ILogger<GetRoleListQueryHandler> logger)
    {
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _rolePermissionRepository = rolePermissionRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<PagedResult<GetRoleListDto>> Handle(GetRoleListQuery request, CancellationToken cancellationToken)
    {
        var roles = await _roleRepository.FindAsync(r =>
            !r.IsDeleted &&
            (string.IsNullOrEmpty(request.SearchTerm) ||
             r.Name.Contains(request.SearchTerm) ||
             (r.Description != null && r.Description.Contains(request.SearchTerm))),
            cancellationToken);

        var totalCount = roles.Count();
        var pagedRoles = roles
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        var dtos = new List<GetRoleListDto>();

        foreach (var role in pagedRoles)
        {
            var userCount = await _userRoleRepository.CountAsync(
                ur => ur.RoleId == role.Id && !ur.IsDeleted,
                cancellationToken);

            var permissionCount = await _rolePermissionRepository.CountAsync(
                rp => rp.RoleId == role.Id && !rp.IsDeleted,
                cancellationToken);

            dtos.Add(new GetRoleListDto
            {
                Id = role.Id,
                Name = role.Name,
                Description = role.Description,
                IsSystemRole = role.IsSystemRole,
                UserCount = userCount,
                PermissionCount = permissionCount
            });
        }

        return new PagedResult<GetRoleListDto>(dtos, totalCount, request.PageNumber, request.PageSize);
    }
}

