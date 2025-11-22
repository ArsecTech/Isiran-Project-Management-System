using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Roles.Commands;

public class CreateRoleCommandHandler : IRequestHandler<CreateRoleCommand, Guid>
{
    private readonly IRepository<Domain.Users.Role> _roleRepository;
    private readonly IRepository<Domain.Users.Permission> _permissionRepository;
    private readonly IRepository<Domain.Users.RolePermission> _rolePermissionRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateRoleCommandHandler> _logger;

    public CreateRoleCommandHandler(
        IRepository<Domain.Users.Role> roleRepository,
        IRepository<Domain.Users.Permission> permissionRepository,
        IRepository<Domain.Users.RolePermission> rolePermissionRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateRoleCommandHandler> logger)
    {
        _roleRepository = roleRepository;
        _permissionRepository = permissionRepository;
        _rolePermissionRepository = rolePermissionRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(CreateRoleCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Creating role: {RoleName}", request.Name);

        var existingRole = await _roleRepository.FirstOrDefaultAsync(
            r => r.Name == request.Name && !r.IsDeleted,
            cancellationToken);

        if (existingRole != null)
        {
            throw new InvalidOperationException("Role name already exists");
        }

        var role = new Domain.Users.Role(request.Name, request.Description, false);
        await _roleRepository.AddAsync(role, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Assign permissions
        foreach (var permissionId in request.PermissionIds)
        {
            var permission = await _permissionRepository.GetByIdAsync(permissionId, cancellationToken);
            if (permission != null && !permission.IsDeleted)
            {
                var rolePermission = new Domain.Users.RolePermission(role.Id, permissionId);
                await _rolePermissionRepository.AddAsync(rolePermission, cancellationToken);
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Role {RoleName} created successfully", request.Name);

        return role.Id;
    }
}

