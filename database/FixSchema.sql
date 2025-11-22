-- =============================================
-- Fix Foreign Key Constraints
-- Run this after Schema.sql if you get cascade errors
-- =============================================

USE [IsiranDB]
GO

-- Drop existing problematic constraints if they exist
IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Resources_Manager')
BEGIN
    ALTER TABLE [Resources] DROP CONSTRAINT [FK_Resources_Manager];
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Projects_ProjectManager')
BEGIN
    ALTER TABLE [Projects] DROP CONSTRAINT [FK_Projects_ProjectManager];
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_Projects')
BEGIN
    ALTER TABLE [Tasks] DROP CONSTRAINT [FK_Tasks_Projects];
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_ParentTask')
BEGIN
    ALTER TABLE [Tasks] DROP CONSTRAINT [FK_Tasks_ParentTask];
END
GO

IF EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Tasks_AssignedTo')
BEGIN
    ALTER TABLE [Tasks] DROP CONSTRAINT [FK_Tasks_AssignedTo];
END
GO

-- Recreate with NO ACTION to avoid cascade cycles
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Resources_Manager')
BEGIN
    ALTER TABLE [Resources]
    ADD CONSTRAINT [FK_Resources_Manager] 
    FOREIGN KEY ([ManagerId]) REFERENCES [Resources]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Projects_ProjectManager')
BEGIN
    ALTER TABLE [Projects]
    ADD CONSTRAINT [FK_Projects_ProjectManager] 
    FOREIGN KEY ([ProjectManagerId]) REFERENCES [Resources]([Id]) 
    ON DELETE NO ACTION 
    ON UPDATE NO ACTION;
END
GO

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

PRINT 'Foreign key constraints fixed successfully!'
GO

