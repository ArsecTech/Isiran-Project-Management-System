-- =============================================
-- Isiran Project Management System
-- Seed Data Script
-- =============================================

USE [IsiranDB]
GO

-- =============================================
-- Seed Roles
-- =============================================

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'Administrator')
BEGIN
    INSERT INTO [Roles] ([Id], [Name], [Description], [IsSystemRole])
    VALUES ('11111111-1111-1111-1111-111111111111', 'Administrator', 'Full system access', 1);
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'ProjectManager')
BEGIN
    INSERT INTO [Roles] ([Id], [Name], [Description], [IsSystemRole])
    VALUES ('22222222-2222-2222-2222-222222222222', 'ProjectManager', 'Can manage projects and tasks', 1);
END
GO

IF NOT EXISTS (SELECT * FROM [Roles] WHERE [Name] = 'TeamMember')
BEGIN
    INSERT INTO [Roles] ([Id], [Name], [Description], [IsSystemRole])
    VALUES ('33333333-3333-3333-3333-333333333333', 'TeamMember', 'Can view and update assigned tasks', 1);
END
GO

-- =============================================
-- Seed Permissions
-- =============================================

DECLARE @AdminRoleId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';
DECLARE @PMRoleId UNIQUEIDENTIFIER = '22222222-2222-2222-2222-222222222222';
DECLARE @TeamRoleId UNIQUEIDENTIFIER = '33333333-3333-3333-3333-333333333333';

-- Project Permissions
DECLARE @ProjCreateId UNIQUEIDENTIFIER = NEWID();
DECLARE @ProjReadId UNIQUEIDENTIFIER = NEWID();
DECLARE @ProjUpdateId UNIQUEIDENTIFIER = NEWID();
DECLARE @ProjDeleteId UNIQUEIDENTIFIER = NEWID();

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Projects.Create')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ProjCreateId, 'Projects.Create', 'Create new projects', 'Projects');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Projects.Read')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ProjReadId, 'Projects.Read', 'View projects', 'Projects');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Projects.Update')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ProjUpdateId, 'Projects.Update', 'Update projects', 'Projects');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Projects.Delete')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ProjDeleteId, 'Projects.Delete', 'Delete projects', 'Projects');
END
GO

-- Task Permissions
DECLARE @TaskCreateId UNIQUEIDENTIFIER = NEWID();
DECLARE @TaskReadId UNIQUEIDENTIFIER = NEWID();
DECLARE @TaskUpdateId UNIQUEIDENTIFIER = NEWID();

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Tasks.Create')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@TaskCreateId, 'Tasks.Create', 'Create new tasks', 'Tasks');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Tasks.Read')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@TaskReadId, 'Tasks.Read', 'View tasks', 'Tasks');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Tasks.Update')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@TaskUpdateId, 'Tasks.Update', 'Update tasks', 'Tasks');
END
GO

-- Resource Permissions
DECLARE @ResCreateId UNIQUEIDENTIFIER = NEWID();
DECLARE @ResReadId UNIQUEIDENTIFIER = NEWID();

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Resources.Create')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ResCreateId, 'Resources.Create', 'Create new resources', 'Resources');
END
GO

IF NOT EXISTS (SELECT * FROM [Permissions] WHERE [Name] = 'Resources.Read')
BEGIN
    INSERT INTO [Permissions] ([Id], [Name], [Description], [Module])
    VALUES (@ResReadId, 'Resources.Read', 'View resources', 'Resources');
END
GO

-- =============================================
-- Seed Default Admin User
-- Password: Admin@123 (BCrypt hash)
-- =============================================

IF NOT EXISTS (SELECT * FROM [Users] WHERE [Username] = 'admin')
BEGIN
    DECLARE @AdminUserId UNIQUEIDENTIFIER = 'AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA';
    
    INSERT INTO [Users] ([Id], [Username], [Email], [PasswordHash], [FirstName], [LastName], [IsActive], [EmailConfirmed])
    VALUES (
        @AdminUserId,
        'admin',
        'admin@isiran.com',
        '$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- BCrypt hash for 'Admin@123'
        'System',
        'Administrator',
        1,
        1
    );

    -- Assign Administrator role
    INSERT INTO [UserRoles] ([Id], [UserId], [RoleId])
    VALUES (NEWID(), @AdminUserId, '11111111-1111-1111-1111-111111111111');
END
GO

-- =============================================
-- Seed Test Users
-- =============================================

-- Test User 1: Project Manager
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Username] = 'pm1')
BEGIN
    DECLARE @PMUserId UNIQUEIDENTIFIER = 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB';
    
    INSERT INTO [Users] ([Id], [Username], [Email], [PasswordHash], [FirstName], [LastName], [IsActive], [EmailConfirmed])
    VALUES (
        @PMUserId,
        'pm1',
        'pm1@isiran.com',
        '$2a$11$K7L1OJ45/4Y2nIvhRVpCe.WHo8K5qY7gKZ5K5K5K5K5K5K5K5K5K5K', -- Password: Admin@123
        'John',
        'Manager',
        1,
        1
    );

    INSERT INTO [UserRoles] ([Id], [UserId], [RoleId])
    VALUES (NEWID(), @PMUserId, '22222222-2222-2222-2222-222222222222');
END
GO

-- Test User 2: Team Member
IF NOT EXISTS (SELECT * FROM [Users] WHERE [Username] = 'user1')
BEGIN
    DECLARE @TeamUserId UNIQUEIDENTIFIER = 'CCCCCCCC-CCCC-CCCC-CCCC-CCCCCCCCCCCC';
    
    INSERT INTO [Users] ([Id], [Username], [Email], [PasswordHash], [FirstName], [LastName], [IsActive], [EmailConfirmed])
    VALUES (
        @TeamUserId,
        'user1',
        'user1@isiran.com',
        '$2a$11$K7L1OJ45/4Y2nIvhRVpCe.WHo8K5qY7gKZ5K5K5K5K5K5K5K5K5K5K', -- Password: Admin@123
        'Jane',
        'Developer',
        1,
        1
    );

    INSERT INTO [UserRoles] ([Id], [UserId], [RoleId])
    VALUES (NEWID(), @TeamUserId, '33333333-3333-3333-3333-333333333333');
END
GO

-- =============================================
-- Seed Sample Resources
-- =============================================

DECLARE @Res1Id UNIQUEIDENTIFIER = 'DDDDDDDD-DDDD-DDDD-DDDD-DDDDDDDDDDDD';
DECLARE @Res2Id UNIQUEIDENTIFIER = 'EEEEEEEE-EEEE-EEEE-EEEE-EEEEEEEEEEEE';
DECLARE @Res3Id UNIQUEIDENTIFIER = 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF';

IF NOT EXISTS (SELECT * FROM [Resources] WHERE [Email] = 'john.doe@isiran.com')
BEGIN
    INSERT INTO [Resources] ([Id], [FirstName], [LastName], [Email], [Type], [Status], [StandardRate], [Department], [JobTitle])
    VALUES (@Res1Id, 'John', 'Doe', 'john.doe@isiran.com', 0, 0, 75.00, 'Engineering', 'Senior Developer');
END
GO

IF NOT EXISTS (SELECT * FROM [Resources] WHERE [Email] = 'jane.smith@isiran.com')
BEGIN
    INSERT INTO [Resources] ([Id], [FirstName], [LastName], [Email], [Type], [Status], [StandardRate], [Department], [JobTitle])
    VALUES (@Res2Id, 'Jane', 'Smith', 'jane.smith@isiran.com', 0, 0, 85.00, 'Engineering', 'Project Manager');
END
GO

IF NOT EXISTS (SELECT * FROM [Resources] WHERE [Email] = 'mike.johnson@isiran.com')
BEGIN
    INSERT INTO [Resources] ([Id], [FirstName], [LastName], [Email], [Type], [Status], [StandardRate], [Department], [JobTitle])
    VALUES (@Res3Id, 'Mike', 'Johnson', 'mike.johnson@isiran.com', 0, 0, 65.00, 'Engineering', 'Developer');
END
GO

-- =============================================
-- Seed Sample Projects
-- =============================================

DECLARE @Proj1Id UNIQUEIDENTIFIER = '11111111-0000-0000-0000-000000000001';
DECLARE @Proj2Id UNIQUEIDENTIFIER = '11111111-0000-0000-0000-000000000002';

IF NOT EXISTS (SELECT * FROM [Projects] WHERE [Code] = 'PROJ001')
BEGIN
    INSERT INTO [Projects] ([Id], [Name], [Code], [Description], [Status], [Priority], [StartDate], [EndDate], [Budget], [ProjectManagerId])
    VALUES (
        @Proj1Id,
        'Website Redesign Project',
        'PROJ001',
        'Complete redesign of company website with modern UI/UX',
        1, -- InProgress
        2, -- High
        DATEADD(day, -30, GETUTCDATE()),
        DATEADD(day, 60, GETUTCDATE()),
        50000.00,
        @Res2Id
    );
END
GO

IF NOT EXISTS (SELECT * FROM [Projects] WHERE [Code] = 'PROJ002')
BEGIN
    INSERT INTO [Projects] ([Id], [Name], [Code], [Description], [Status], [Priority], [StartDate], [EndDate], [Budget], [ProjectManagerId])
    VALUES (
        @Proj2Id,
        'Mobile App Development',
        'PROJ002',
        'Development of iOS and Android mobile application',
        0, -- Planning
        3, -- Critical
        DATEADD(day, 7, GETUTCDATE()),
        DATEADD(day, 120, GETUTCDATE()),
        100000.00,
        @Res2Id
    );
END
GO

-- =============================================
-- Seed Sample Tasks
-- =============================================

DECLARE @Task1Id UNIQUEIDENTIFIER = '22222222-0000-0000-0000-000000000001';
DECLARE @Task2Id UNIQUEIDENTIFIER = '22222222-0000-0000-0000-000000000002';
DECLARE @Task3Id UNIQUEIDENTIFIER = '22222222-0000-0000-0000-000000000003';
DECLARE @Task4Id UNIQUEIDENTIFIER = '22222222-0000-0000-0000-000000000004';

-- Tasks for Project 1
IF NOT EXISTS (SELECT * FROM [Tasks] WHERE [Id] = @Task1Id)
BEGIN
    INSERT INTO [Tasks] ([Id], [ProjectId], [Name], [Description], [Type], [Status], [Priority], [StartDate], [Duration], [PercentComplete], [AssignedToId], [DisplayOrder], [WbsCode], [WbsLevel])
    VALUES (
        @Task1Id,
        @Proj1Id,
        'Design Mockups',
        'Create initial design mockups for all pages',
        0, -- Task
        1, -- InProgress
        2, -- High
        DATEADD(day, -30, GETUTCDATE()),
        10,
        60,
        @Res1Id,
        1,
        '1',
        1
    );
END
GO

IF NOT EXISTS (SELECT * FROM [Tasks] WHERE [Id] = @Task2Id)
BEGIN
    INSERT INTO [Tasks] ([Id], [ProjectId], [Name], [Description], [Type], [Status], [Priority], [StartDate], [Duration], [PercentComplete], [AssignedToId], [DisplayOrder], [WbsCode], [WbsLevel])
    VALUES (
        @Task2Id,
        @Proj1Id,
        'Frontend Development',
        'Implement frontend components based on designs',
        0, -- Task
        1, -- InProgress
        2, -- High
        DATEADD(day, -20, GETUTCDATE()),
        20,
        40,
        @Res1Id,
        2,
        '2',
        1
    );
END
GO

IF NOT EXISTS (SELECT * FROM [Tasks] WHERE [Id] = @Task3Id)
BEGIN
    INSERT INTO [Tasks] ([Id], [ProjectId], [Name], [Description], [Type], [Status], [Priority], [StartDate], [Duration], [PercentComplete], [AssignedToId], [DisplayOrder], [WbsCode], [WbsLevel])
    VALUES (
        @Task3Id,
        @Proj1Id,
        'Backend API Development',
        'Develop RESTful API endpoints',
        0, -- Task
        0, -- NotStarted
        2, -- High
        DATEADD(day, -10, GETUTCDATE()),
        15,
        0,
        @Res3Id,
        3,
        '3',
        1
    );
END
GO

IF NOT EXISTS (SELECT * FROM [Tasks] WHERE [Id] = @Task4Id)
BEGIN
    INSERT INTO [Tasks] ([Id], [ProjectId], [Name], [Description], [Type], [Status], [Priority], [StartDate], [Duration], [PercentComplete], [AssignedToId], [DisplayOrder], [WbsCode], [WbsLevel])
    VALUES (
        @Task4Id,
        @Proj1Id,
        'Testing & QA',
        'Perform comprehensive testing',
        0, -- Task
        0, -- NotStarted
        1, -- Medium
        DATEADD(day, 20, GETUTCDATE()),
        10,
        0,
        @Res3Id,
        4,
        '4',
        1
    );
END
GO

-- Task Dependencies
IF NOT EXISTS (SELECT * FROM [TaskDependencies] WHERE [PredecessorTaskId] = @Task1Id AND [SuccessorTaskId] = @Task2Id)
BEGIN
    INSERT INTO [TaskDependencies] ([Id], [PredecessorTaskId], [SuccessorTaskId], [Type], [Lag])
    VALUES (NEWID(), @Task1Id, @Task2Id, 0, 0); -- FinishToStart
END
GO

IF NOT EXISTS (SELECT * FROM [TaskDependencies] WHERE [PredecessorTaskId] = @Task2Id AND [SuccessorTaskId] = @Task3Id)
BEGIN
    INSERT INTO [TaskDependencies] ([Id], [PredecessorTaskId], [SuccessorTaskId], [Type], [Lag])
    VALUES (NEWID(), @Task2Id, @Task3Id, 0, 0); -- FinishToStart
END
GO

IF NOT EXISTS (SELECT * FROM [TaskDependencies] WHERE [PredecessorTaskId] = @Task3Id AND [SuccessorTaskId] = @Task4Id)
BEGIN
    INSERT INTO [TaskDependencies] ([Id], [PredecessorTaskId], [SuccessorTaskId], [Type], [Lag])
    VALUES (NEWID(), @Task3Id, @Task4Id, 0, 0); -- FinishToStart
END
GO

-- Task Resources
IF NOT EXISTS (SELECT * FROM [TaskResources] WHERE [TaskId] = @Task1Id AND [ResourceId] = @Res1Id)
BEGIN
    INSERT INTO [TaskResources] ([Id], [TaskId], [ResourceId], [AllocationPercentage], [EstimatedHours], [HourlyRate])
    VALUES (NEWID(), @Task1Id, @Res1Id, 100.00, 80.00, 75.00);
END
GO

IF NOT EXISTS (SELECT * FROM [TaskResources] WHERE [TaskId] = @Task2Id AND [ResourceId] = @Res1Id)
BEGIN
    INSERT INTO [TaskResources] ([Id], [TaskId], [ResourceId], [AllocationPercentage], [EstimatedHours], [HourlyRate])
    VALUES (NEWID(), @Task2Id, @Res1Id, 100.00, 160.00, 75.00);
END
GO

-- Time Entries
IF NOT EXISTS (SELECT * FROM [TaskTimeEntries] WHERE [TaskId] = @Task1Id AND [ResourceId] = @Res1Id AND [Date] = DATEADD(day, -5, GETUTCDATE()))
BEGIN
    INSERT INTO [TaskTimeEntries] ([Id], [TaskId], [ResourceId], [Date], [Hours], [Description], [IsBillable], [HourlyRate])
    VALUES (NEWID(), @Task1Id, @Res1Id, DATEADD(day, -5, GETUTCDATE()), 8.00, 'Working on design mockups', 1, 75.00);
END
GO

PRINT 'Seed data inserted successfully!'
PRINT 'Test Users:'
PRINT '  - admin / Admin@123 (Administrator)'
PRINT '  - pm1 / Admin@123 (Project Manager)'
PRINT '  - user1 / Admin@123 (Team Member)'
GO
