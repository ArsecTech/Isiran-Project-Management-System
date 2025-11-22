using Isiran.Application.Common.Exceptions;
using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;
using Unit = MediatR.Unit;

namespace Isiran.Application.Users.Commands;

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, Unit>
{
    private readonly IUserRepository _userRepository;
    private readonly IRepository<Domain.Users.Role> _roleRepository;
    private readonly IRepository<Domain.Users.UserRole> _userRoleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<UpdateUserCommandHandler> _logger;

    public UpdateUserCommandHandler(
        IUserRepository userRepository,
        IRepository<Domain.Users.Role> roleRepository,
        IRepository<Domain.Users.UserRole> userRoleRepository,
        IUnitOfWork unitOfWork,
        ILogger<UpdateUserCommandHandler> logger)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _userRoleRepository = userRoleRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Unit> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Updating user: {UserId}", request.Id);

        var user = await _userRepository.GetByIdAsync(request.Id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {request.Id} not found.");
        }

        // Update profile
        user.UpdateProfile(request.FirstName, request.LastName, request.Email);

        // Update active status
        if (request.IsActive.HasValue)
        {
            if (request.IsActive.Value)
            {
                user.Activate();
            }
            else
            {
                user.Deactivate();
            }
        }

        await _userRepository.UpdateAsync(user, cancellationToken);

        // Update roles if provided
        if (request.RoleIds != null)
        {
            // Remove existing roles
            var existingRoles = await _userRoleRepository.FindAsync(
                ur => ur.UserId == request.Id && !ur.IsDeleted,
                cancellationToken);

            foreach (var role in existingRoles)
            {
                await _userRoleRepository.DeleteAsync(role, cancellationToken);
            }

            // Add new roles
            foreach (var roleId in request.RoleIds)
            {
                var role = await _roleRepository.GetByIdAsync(roleId, cancellationToken);
                if (role != null && !role.IsDeleted)
                {
                    await _userRepository.AssignRoleAsync(user.Id, roleId, cancellationToken);
                }
            }
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {UserId} updated successfully", request.Id);

        return Unit.Value;
    }
}

