using Isiran.Core.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace Isiran.Application.Auth.Commands;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Guid>
{
    private readonly IUserRepository _userRepository;
    private readonly IRepository<Domain.Users.Role> _roleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        IUserRepository userRepository,
        IRepository<Domain.Users.Role> roleRepository,
        IUnitOfWork unitOfWork,
        ILogger<RegisterCommandHandler> logger)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Registering new user: {Username}", request.Username);

        // Check if username exists
        var existingUser = await _userRepository.GetByUsernameAsync(request.Username, cancellationToken);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Username already exists");
        }

        existingUser = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already exists");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create user
        var user = new Domain.Users.User(
            request.Username,
            request.Email,
            passwordHash,
            request.FirstName,
            request.LastName);

        user.ConfirmEmail(); // Auto-confirm for now

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Assign default role (TeamMember)
        var teamMemberRole = await _roleRepository.FirstOrDefaultAsync(
            r => r.Name == "TeamMember" && !r.IsDeleted,
            cancellationToken);

        if (teamMemberRole != null)
        {
            await _userRepository.AssignRoleAsync(user.Id, teamMemberRole.Id, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("User {Username} registered successfully", request.Username);

        return user.Id;
    }
}

