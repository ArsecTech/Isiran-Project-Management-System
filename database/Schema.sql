-- =============================================
-- Isiran Project Management System
-- Database Schema Script
-- SQL Server 2019+
-- =============================================

USE [master]
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'IsiranDB')
BEGIN
    CREATE DATABASE [IsiranDB]
    COLLATE SQL_Latin1_General_CP1_CI_AS
END
GO

USE [IsiranDB]
GO

-- =============================================
-- Enable Row Versioning for Optimistic Concurrency
-- =============================================

-- =============================================
-- Users and Authentication
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE [Users] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Username] NVARCHAR(100) NOT NULL UNIQUE,
        [Email] NVARCHAR(200) NOT NULL UNIQUE,
        [PasswordHash] NVARCHAR(500) NOT NULL,
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [EmailConfirmed] BIT NOT NULL DEFAULT 0,
        [LastLoginAt] DATETIME2 NULL,
        [RefreshToken] NVARCHAR(500) NULL,
        [RefreshTokenExpiryTime] DATETIME2 NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );

    CREATE INDEX [IX_Users_Username] ON [Users]([Username]);
    CREATE INDEX [IX_Users_Email] ON [Users]([Email]);
    CREATE INDEX [IX_Users_IsActive] ON [Users]([IsActive]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
BEGIN
    CREATE TABLE [Roles] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(100) NOT NULL UNIQUE,
        [Description] NVARCHAR(500) NULL,
        [IsSystemRole] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Permissions')
BEGIN
    CREATE TABLE [Permissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(100) NOT NULL,
        [Description] NVARCHAR(500) NULL,
        [Module] NVARCHAR(100) NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );

    CREATE INDEX [IX_Permissions_Module] ON [Permissions]([Module]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserRoles')
BEGIN
    CREATE TABLE [UserRoles] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [RoleId] UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_UserRoles_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserRoles_Roles] FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_UserRoles_UserId_RoleId] UNIQUE ([UserId], [RoleId])
    );

    CREATE INDEX [IX_UserRoles_UserId] ON [UserRoles]([UserId]);
    CREATE INDEX [IX_UserRoles_RoleId] ON [UserRoles]([RoleId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    CREATE TABLE [RolePermissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [RoleId] UNIQUEIDENTIFIER NOT NULL,
        [PermissionId] UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_RolePermissions_Roles] FOREIGN KEY ([RoleId]) REFERENCES [Roles]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolePermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_RolePermissions_RoleId_PermissionId] UNIQUE ([RoleId], [PermissionId])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'UserPermissions')
BEGIN
    CREATE TABLE [UserPermissions] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [PermissionId] UNIQUEIDENTIFIER NOT NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_UserPermissions_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UserPermissions_Permissions] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions]([Id]) ON DELETE CASCADE,
        CONSTRAINT [UQ_UserPermissions_UserId_PermissionId] UNIQUE ([UserId], [PermissionId])
    );
END
GO

-- =============================================
-- Resources
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Resources')
BEGIN
    CREATE TABLE [Resources] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [FirstName] NVARCHAR(100) NOT NULL,
        [LastName] NVARCHAR(100) NOT NULL,
        [Email] NVARCHAR(200) NOT NULL UNIQUE,
        [PhoneNumber] NVARCHAR(50) NULL,
        [Type] INT NOT NULL DEFAULT 0,
        [Status] INT NOT NULL DEFAULT 0,
        [MaxUnits] DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        [StandardRate] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [OvertimeRate] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Department] NVARCHAR(100) NULL,
        [JobTitle] NVARCHAR(100) NULL,
        [ManagerId] UNIQUEIDENTIFIER NULL,
        [CalendarId] NVARCHAR(100) NOT NULL DEFAULT 'Standard',
        [WorkingHoursPerDay] INT NOT NULL DEFAULT 8,
        [WorkingDaysPerWeek] INT NOT NULL DEFAULT 5,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );

    CREATE INDEX [IX_Resources_Email] ON [Resources]([Email]);
    CREATE INDEX [IX_Resources_Status] ON [Resources]([Status]);
    CREATE INDEX [IX_Resources_Type] ON [Resources]([Type]);
    CREATE INDEX [IX_Resources_ManagerId] ON [Resources]([ManagerId]);
END
GO

-- Add Manager Foreign Key separately to avoid cascade cycle
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Resources_Manager')
BEGIN
    ALTER TABLE [Resources]
    ADD CONSTRAINT [FK_Resources_Manager] 
    FOREIGN KEY ([ManagerId]) REFERENCES [Resources]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

-- =============================================
-- Projects
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Projects')
BEGIN
    CREATE TABLE [Projects] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NOT NULL UNIQUE,
        [Description] NVARCHAR(2000) NULL,
        [Status] INT NOT NULL DEFAULT 0,
        [Priority] INT NOT NULL DEFAULT 1,
        [StartDate] DATETIME2 NULL,
        [EndDate] DATETIME2 NULL,
        [ActualStartDate] DATETIME2 NULL,
        [ActualEndDate] DATETIME2 NULL,
        [Budget] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ActualCost] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [ProjectManagerId] UNIQUEIDENTIFIER NULL,
        [OwnerId] UNIQUEIDENTIFIER NULL,
        [AutoSchedule] BIT NOT NULL DEFAULT 1,
        [CriticalPathEnabled] BIT NOT NULL DEFAULT 1,
        [ResourceLevelingEnabled] BIT NOT NULL DEFAULT 1,
        [WorkingHoursPerDay] INT NOT NULL DEFAULT 8,
        [WorkingDaysPerWeek] INT NOT NULL DEFAULT 5,
        [CalendarId] NVARCHAR(100) NOT NULL DEFAULT 'Standard',
        [AllowOvertime] BIT NOT NULL DEFAULT 0,
        [DefaultHourlyRate] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [Currency] NVARCHAR(10) NOT NULL DEFAULT 'USD',
        [TimeZone] NVARCHAR(50) NOT NULL DEFAULT 'UTC',
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );

    CREATE INDEX [IX_Projects_Code] ON [Projects]([Code]);
    CREATE INDEX [IX_Projects_Name] ON [Projects]([Name]);
    CREATE INDEX [IX_Projects_Status] ON [Projects]([Status]);
    CREATE INDEX [IX_Projects_ProjectManagerId] ON [Projects]([ProjectManagerId]);
    CREATE INDEX [IX_Projects_StartDate] ON [Projects]([StartDate]);
    CREATE INDEX [IX_Projects_EndDate] ON [Projects]([EndDate]);
END
GO

-- Add ProjectManager Foreign Key separately
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Projects_ProjectManager')
BEGIN
    ALTER TABLE [Projects]
    ADD CONSTRAINT [FK_Projects_ProjectManager] 
    FOREIGN KEY ([ProjectManagerId]) REFERENCES [Resources]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectResources')
BEGIN
    CREATE TABLE [ProjectResources] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ProjectId] UNIQUEIDENTIFIER NOT NULL,
        [ResourceId] UNIQUEIDENTIFIER NOT NULL,
        [Role] NVARCHAR(100) NOT NULL,
        [AllocationPercentage] DECIMAL(5,2) NOT NULL,
        [StartDate] DATETIME2 NULL,
        [EndDate] DATETIME2 NULL,
        [HourlyRate] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_ProjectResources_Projects] FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ProjectResources_Resources] FOREIGN KEY ([ResourceId]) REFERENCES [Resources]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_ProjectResources_ProjectId] ON [ProjectResources]([ProjectId]);
    CREATE INDEX [IX_ProjectResources_ResourceId] ON [ProjectResources]([ResourceId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ProjectMilestones')
BEGIN
    CREATE TABLE [ProjectMilestones] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ProjectId] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(2000) NULL,
        [TargetDate] DATETIME2 NOT NULL,
        [ActualDate] DATETIME2 NULL,
        [IsCompleted] BIT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_ProjectMilestones_Projects] FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_ProjectMilestones_ProjectId] ON [ProjectMilestones]([ProjectId]);
    CREATE INDEX [IX_ProjectMilestones_TargetDate] ON [ProjectMilestones]([TargetDate]);
END
GO

-- =============================================
-- Tasks
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tasks')
BEGIN
    CREATE TABLE [Tasks] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [ProjectId] UNIQUEIDENTIFIER NOT NULL,
        [Name] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(2000) NULL,
        [Type] INT NOT NULL DEFAULT 0,
        [Status] INT NOT NULL DEFAULT 0,
        [Priority] INT NOT NULL DEFAULT 1,
        [StartDate] DATETIME2 NULL,
        [EndDate] DATETIME2 NULL,
        [ActualStartDate] DATETIME2 NULL,
        [ActualEndDate] DATETIME2 NULL,
        [Duration] INT NOT NULL DEFAULT 1,
        [ActualDuration] INT NOT NULL DEFAULT 0,
        [EstimatedEffort] DECIMAL(18,2) NULL,
        [ActualEffort] DECIMAL(18,2) NULL,
        [EstimatedCost] DECIMAL(18,2) NULL,
        [ActualCost] DECIMAL(18,2) NULL,
        [PercentComplete] INT NULL DEFAULT 0,
        [ParentTaskId] UNIQUEIDENTIFIER NULL,
        [AssignedToId] UNIQUEIDENTIFIER NULL,
        [DisplayOrder] INT NOT NULL DEFAULT 0,
        [Constraint] INT NOT NULL DEFAULT 0,
        [ConstraintDate] DATETIME2 NULL,
        [WbsCode] NVARCHAR(100) NOT NULL DEFAULT '',
        [WbsLevel] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL
    );

    CREATE INDEX [IX_Tasks_ProjectId] ON [Tasks]([ProjectId]);
    CREATE INDEX [IX_Tasks_ParentTaskId] ON [Tasks]([ParentTaskId]);
    CREATE INDEX [IX_Tasks_AssignedToId] ON [Tasks]([AssignedToId]);
    CREATE INDEX [IX_Tasks_Status] ON [Tasks]([Status]);
    CREATE INDEX [IX_Tasks_ProjectId_DisplayOrder] ON [Tasks]([ProjectId], [DisplayOrder]);
    CREATE INDEX [IX_Tasks_StartDate] ON [Tasks]([StartDate]);
    CREATE INDEX [IX_Tasks_EndDate] ON [Tasks]([EndDate]);
END
GO

-- Add Task Foreign Keys separately
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_Projects')
BEGIN
    ALTER TABLE [Tasks]
    ADD CONSTRAINT [FK_Tasks_Projects] 
    FOREIGN KEY ([ProjectId]) REFERENCES [Projects]([Id]) 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_ParentTask')
BEGIN
    ALTER TABLE [Tasks]
    ADD CONSTRAINT [FK_Tasks_ParentTask] 
    FOREIGN KEY ([ParentTaskId]) REFERENCES [Tasks]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_AssignedTo')
BEGIN
    ALTER TABLE [Tasks]
    ADD CONSTRAINT [FK_Tasks_AssignedTo] 
    FOREIGN KEY ([AssignedToId]) REFERENCES [Resources]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaskDependencies')
BEGIN
    CREATE TABLE [TaskDependencies] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [PredecessorTaskId] UNIQUEIDENTIFIER NOT NULL,
        [SuccessorTaskId] UNIQUEIDENTIFIER NOT NULL,
        [Type] INT NOT NULL DEFAULT 0,
        [Lag] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_TaskDependencies_Predecessor] FOREIGN KEY ([PredecessorTaskId]) REFERENCES [Tasks]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TaskDependencies_Successor] FOREIGN KEY ([SuccessorTaskId]) REFERENCES [Tasks]([Id]) ON DELETE CASCADE,
        CONSTRAINT [CK_TaskDependencies_NoSelfReference] CHECK ([PredecessorTaskId] <> [SuccessorTaskId])
    );

    CREATE INDEX [IX_TaskDependencies_PredecessorTaskId] ON [TaskDependencies]([PredecessorTaskId]);
    CREATE INDEX [IX_TaskDependencies_SuccessorTaskId] ON [TaskDependencies]([SuccessorTaskId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaskResources')
BEGIN
    CREATE TABLE [TaskResources] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TaskId] UNIQUEIDENTIFIER NOT NULL,
        [ResourceId] UNIQUEIDENTIFIER NOT NULL,
        [AllocationPercentage] DECIMAL(5,2) NOT NULL,
        [EstimatedHours] DECIMAL(18,2) NULL,
        [ActualHours] DECIMAL(18,2) NULL,
        [HourlyRate] DECIMAL(18,2) NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_TaskResources_Tasks] FOREIGN KEY ([TaskId]) REFERENCES [Tasks]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TaskResources_Resources] FOREIGN KEY ([ResourceId]) REFERENCES [Resources]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_TaskResources_TaskId] ON [TaskResources]([TaskId]);
    CREATE INDEX [IX_TaskResources_ResourceId] ON [TaskResources]([ResourceId]);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TaskTimeEntries')
BEGIN
    CREATE TABLE [TaskTimeEntries] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [TaskId] UNIQUEIDENTIFIER NOT NULL,
        [ResourceId] UNIQUEIDENTIFIER NOT NULL,
        [Date] DATETIME2 NOT NULL,
        [Hours] DECIMAL(18,2) NOT NULL,
        [Description] NVARCHAR(1000) NULL,
        [IsBillable] BIT NOT NULL DEFAULT 1,
        [HourlyRate] DECIMAL(18,2) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_TaskTimeEntries_Tasks] FOREIGN KEY ([TaskId]) REFERENCES [Tasks]([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TaskTimeEntries_Resources] FOREIGN KEY ([ResourceId]) REFERENCES [Resources]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_TaskTimeEntries_TaskId] ON [TaskTimeEntries]([TaskId]);
    CREATE INDEX [IX_TaskTimeEntries_ResourceId] ON [TaskTimeEntries]([ResourceId]);
    CREATE INDEX [IX_TaskTimeEntries_Date] ON [TaskTimeEntries]([Date]);
END
GO

-- =============================================
-- Notifications
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
BEGIN
    CREATE TABLE [Notifications] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [UserId] UNIQUEIDENTIFIER NOT NULL,
        [Title] NVARCHAR(200) NOT NULL,
        [Message] NVARCHAR(2000) NOT NULL,
        [Type] INT NOT NULL DEFAULT 0,
        [Priority] INT NOT NULL DEFAULT 1,
        [IsRead] BIT NOT NULL DEFAULT 0,
        [ReadAt] DATETIME2 NULL,
        [ActionUrl] NVARCHAR(500) NULL,
        [RelatedEntityId] UNIQUEIDENTIFIER NULL,
        [RelatedEntityType] NVARCHAR(100) NULL,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        CONSTRAINT [FK_Notifications_Users] FOREIGN KEY ([UserId]) REFERENCES [Users]([Id]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_Notifications_UserId] ON [Notifications]([UserId]);
    CREATE INDEX [IX_Notifications_IsRead] ON [Notifications]([IsRead]);
    CREATE INDEX [IX_Notifications_CreatedAt] ON [Notifications]([CreatedAt]);
END
GO

PRINT 'Database schema created successfully!'
GO

