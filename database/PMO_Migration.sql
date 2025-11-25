-- PMO Integration Tables Migration Script
-- Run this script to add PMO integration tables to the existing database

-- Integration Configs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'IntegrationConfigs')
BEGIN
    CREATE TABLE IntegrationConfigs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        IntegrationType INT NOT NULL, -- 0: Jira, 1: Confluence, 2: PowerBI
        Name NVARCHAR(255) NOT NULL,
        BaseUrl NVARCHAR(500) NOT NULL,
        ClientId NVARCHAR(255) NULL,
        ClientSecret NVARCHAR(MAX) NULL, -- Encrypted
        AccessToken NVARCHAR(MAX) NULL, -- Encrypted
        RefreshToken NVARCHAR(MAX) NULL, -- Encrypted
        TokenExpiresAt DATETIME2 NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        CreatedBy NVARCHAR(255) NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT UQ_IntegrationConfigs_Name UNIQUE (Name)
    );
    PRINT 'IntegrationConfigs table created.';
END
ELSE
BEGIN
    PRINT 'IntegrationConfigs table already exists.';
END

-- Sync Logs Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SyncLogs')
BEGIN
    CREATE TABLE SyncLogs (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        IntegrationType INT NOT NULL, -- 0: Jira, 1: Confluence, 2: PowerBI
        ProjectId UNIQUEIDENTIFIER NULL,
        Status INT NOT NULL, -- 0: Success, 1: Failed, 2: InProgress
        StartTime DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        EndTime DATETIME2 NULL,
        RecordsSynced INT NULL,
        ErrorMessage NVARCHAR(MAX) NULL,
        CreatedBy UNIQUEIDENTIFIER NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_SyncLogs_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
        CONSTRAINT FK_SyncLogs_Users FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
    );
    CREATE INDEX IX_SyncLogs_ProjectId ON SyncLogs(ProjectId);
    CREATE INDEX IX_SyncLogs_IntegrationType ON SyncLogs(IntegrationType);
    CREATE INDEX IX_SyncLogs_Status ON SyncLogs(Status);
    PRINT 'SyncLogs table created.';
END
ELSE
BEGIN
    PRINT 'SyncLogs table already exists.';
END

-- Jira Projects Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'JiraProjects')
BEGIN
    CREATE TABLE JiraProjects (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        JiraProjectKey NVARCHAR(50) NOT NULL,
        JiraProjectId NVARCHAR(50) NOT NULL,
        JiraProjectName NVARCHAR(255) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_JiraProjects_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_JiraProjects_ProjectKey UNIQUE (ProjectId, JiraProjectKey)
    );
    CREATE INDEX IX_JiraProjects_ProjectId ON JiraProjects(ProjectId);
    PRINT 'JiraProjects table created.';
END
ELSE
BEGIN
    PRINT 'JiraProjects table already exists.';
END

-- Confluence Pages Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ConfluencePages')
BEGIN
    CREATE TABLE ConfluencePages (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        PageId NVARCHAR(50) NOT NULL,
        Title NVARCHAR(500) NOT NULL,
        Content NVARCHAR(MAX) NULL,
        Url NVARCHAR(1000) NULL,
        SpaceKey NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_ConfluencePages_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_ConfluencePages_PageId UNIQUE (ProjectId, PageId)
    );
    CREATE INDEX IX_ConfluencePages_ProjectId ON ConfluencePages(ProjectId);
    PRINT 'ConfluencePages table created.';
END
ELSE
BEGIN
    PRINT 'ConfluencePages table already exists.';
END

-- Power BI Reports Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PowerBIReports')
BEGIN
    CREATE TABLE PowerBIReports (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        ReportId NVARCHAR(100) NOT NULL,
        ReportName NVARCHAR(255) NOT NULL,
        WorkspaceId NVARCHAR(100) NULL,
        WorkspaceName NVARCHAR(255) NULL,
        EmbedUrl NVARCHAR(1000) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_PowerBIReports_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_PowerBIReports_ReportId UNIQUE (ProjectId, ReportId)
    );
    CREATE INDEX IX_PowerBIReports_ProjectId ON PowerBIReports(ProjectId);
    PRINT 'PowerBIReports table created.';
END
ELSE
BEGIN
    PRINT 'PowerBIReports table already exists.';
END

-- KPI Metrics Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KPIMetrics')
BEGIN
    CREATE TABLE KPIMetrics (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        ProjectId UNIQUEIDENTIFIER NOT NULL,
        MetricDate DATE NOT NULL,
        EV DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Earned Value
        PV DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Planned Value
        AC DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Actual Cost
        BAC DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Budget at Completion
        CPI DECIMAL(18, 4) NULL, -- Cost Performance Index
        SPI DECIMAL(18, 4) NULL, -- Schedule Performance Index
        EAC DECIMAL(18, 2) NULL, -- Estimate at Completion
        ETC DECIMAL(18, 2) NULL, -- Estimate to Complete
        VAC DECIMAL(18, 2) NULL, -- Variance at Completion
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_KPIMetrics_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_KPIMetrics_ProjectDate UNIQUE (ProjectId, MetricDate)
    );
    CREATE INDEX IX_KPIMetrics_ProjectId ON KPIMetrics(ProjectId);
    CREATE INDEX IX_KPIMetrics_MetricDate ON KPIMetrics(MetricDate);
    PRINT 'KPIMetrics table created.';
END
ELSE
BEGIN
    PRINT 'KPIMetrics table already exists.';
END

-- Activity Dependencies Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ActivityDependencies')
BEGIN
    CREATE TABLE ActivityDependencies (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        PredecessorActivityId UNIQUEIDENTIFIER NOT NULL,
        SuccessorActivityId UNIQUEIDENTIFIER NOT NULL,
        DependencyType INT NOT NULL DEFAULT 0, -- 0: FinishToStart, 1: StartToStart, 2: FinishToFinish, 3: StartToFinish
        Lag INT NOT NULL DEFAULT 0, -- Lag in days
        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 NULL,
        UpdatedBy NVARCHAR(255) NULL,
        IsDeleted BIT NOT NULL DEFAULT 0,
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_ActivityDependencies_Predecessor FOREIGN KEY (PredecessorActivityId) REFERENCES Tasks(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_ActivityDependencies_Successor FOREIGN KEY (SuccessorActivityId) REFERENCES Tasks(Id) ON DELETE NO ACTION,
        CONSTRAINT CK_ActivityDependencies_NoSelfReference CHECK (PredecessorActivityId != SuccessorActivityId)
    );
    CREATE INDEX IX_ActivityDependencies_Predecessor ON ActivityDependencies(PredecessorActivityId);
    CREATE INDEX IX_ActivityDependencies_Successor ON ActivityDependencies(SuccessorActivityId);
    PRINT 'ActivityDependencies table created.';
END
ELSE
BEGIN
    PRINT 'ActivityDependencies table already exists.';
END

-- Add Jira fields to Tasks table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tasks') AND name = 'JiraIssueKey')
BEGIN
    ALTER TABLE Tasks ADD JiraIssueKey NVARCHAR(50) NULL;
    PRINT 'JiraIssueKey column added to Tasks table.';
END
ELSE
BEGIN
    PRINT 'JiraIssueKey column already exists in Tasks table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tasks') AND name = 'JiraIssueId')
BEGIN
    ALTER TABLE Tasks ADD JiraIssueId NVARCHAR(50) NULL;
    PRINT 'JiraIssueId column added to Tasks table.';
END
ELSE
BEGIN
    PRINT 'JiraIssueId column already exists in Tasks table.';
END

PRINT 'PMO Integration migration completed successfully!';

