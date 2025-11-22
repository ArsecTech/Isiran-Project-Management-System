using AutoMapper;

namespace Isiran.Application.Common.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Projects
        CreateMap<Domain.Projects.Project, Projects.Queries.GetProjectDto>();
        CreateMap<Domain.Projects.Project, Projects.Queries.GetProjectListDto>();
        CreateMap<Projects.Commands.CreateProjectCommand, Domain.Projects.Project>();
        CreateMap<Projects.Commands.UpdateProjectCommand, Domain.Projects.Project>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

        // Tasks
        CreateMap<Domain.Tasks.ProjectTask, Tasks.Queries.GetTaskDto>();
        CreateMap<Domain.Tasks.ProjectTask, Tasks.Queries.GetTaskListDto>();
        CreateMap<Tasks.Commands.CreateTaskCommand, Domain.Tasks.ProjectTask>();
        CreateMap<Tasks.Commands.UpdateTaskCommand, Domain.Tasks.ProjectTask>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.ProjectId, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore());

        // Resources
        CreateMap<Domain.Resources.Resource, Resources.Queries.GetResourceDto>();
        CreateMap<Domain.Resources.Resource, Resources.Queries.GetResourceListDto>();
        CreateMap<Resources.Commands.CreateResourceCommand, Domain.Resources.Resource>();

        // Users
        CreateMap<Domain.Users.User, Users.Queries.GetUserDto>();
        CreateMap<Domain.Users.User, Users.Queries.GetUserListDto>();

        // Roles
        CreateMap<Domain.Users.Role, Roles.Queries.GetRoleListDto>();
    }
}

