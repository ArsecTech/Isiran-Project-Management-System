-- Migration: Add Organizations table and OrganizationId to Resources and Projects
-- Date: 2025-01-XX

-- Set required options
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Create Organizations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Organizations')
BEGIN
    CREATE TABLE [dbo].[Organizations] (
        [Id] UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        [Name] NVARCHAR(200) NOT NULL,
        [Code] NVARCHAR(50) NULL,
        [Description] NVARCHAR(2000) NULL,
        [ParentOrganizationId] UNIQUEIDENTIFIER NULL,
        [Level] INT NOT NULL DEFAULT 0,
        [ManagerId] NVARCHAR(100) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] DATETIME2 NULL,
        [CreatedBy] NVARCHAR(100) NULL,
        [UpdatedBy] NVARCHAR(100) NULL,
        [IsDeleted] BIT NOT NULL DEFAULT 0,
        [RowVersion] ROWVERSION NOT NULL,
        
        CONSTRAINT [FK_Organizations_ParentOrganization] 
            FOREIGN KEY ([ParentOrganizationId]) 
            REFERENCES [dbo].[Organizations]([Id])
            ON DELETE NO ACTION
    );

    -- Create indexes
    CREATE UNIQUE NONCLUSTERED INDEX [IX_Organizations_Code] 
        ON [dbo].[Organizations]([Code]) 
        WHERE [Code] IS NOT NULL AND [IsDeleted] = 0;
    
    CREATE NONCLUSTERED INDEX [IX_Organizations_Name] 
        ON [dbo].[Organizations]([Name]);
    
    CREATE NONCLUSTERED INDEX [IX_Organizations_ParentOrganizationId] 
        ON [dbo].[Organizations]([ParentOrganizationId]);
END
GO

-- Add OrganizationId to Resources table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Resources') AND name = 'OrganizationId')
BEGIN
    ALTER TABLE [dbo].[Resources]
    ADD [OrganizationId] UNIQUEIDENTIFIER NULL;
    
    ALTER TABLE [dbo].[Resources]
    ADD CONSTRAINT [FK_Resources_Organization] 
        FOREIGN KEY ([OrganizationId]) 
        REFERENCES [dbo].[Organizations]([Id])
        ON DELETE SET NULL;
    
    CREATE NONCLUSTERED INDEX [IX_Resources_OrganizationId] 
        ON [dbo].[Resources]([OrganizationId]);
END
GO

-- Add OrganizationId to Projects table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Projects') AND name = 'OrganizationId')
BEGIN
    ALTER TABLE [dbo].[Projects]
    ADD [OrganizationId] UNIQUEIDENTIFIER NULL;
    
    ALTER TABLE [dbo].[Projects]
    ADD CONSTRAINT [FK_Projects_Organization] 
        FOREIGN KEY ([OrganizationId]) 
        REFERENCES [dbo].[Organizations]([Id])
        ON DELETE SET NULL;
    
    CREATE NONCLUSTERED INDEX [IX_Projects_OrganizationId] 
        ON [dbo].[Projects]([OrganizationId]);
END
GO

PRINT 'Migration completed: Organizations table and OrganizationId columns added successfully.';
GO

