-- PMO Integration Tool - Database Schema
-- Based on SRS Requirements

-- ============================================
-- Integration Configuration Tables
-- ============================================

-- Integration Types Enum (stored as int)
-- 0 = Jira, 1 = Confluence, 2 = PowerBI

CREATE TABLE IntegrationConfigs (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    IntegrationType INT NOT NULL, -- 0: Jira, 1: Confluence, 2: PowerBI
    Name NVARCHAR(200) NOT NULL,
    BaseUrl NVARCHAR(500) NOT NULL,
    ClientId NVARCHAR(500) NULL,
    ClientSecret NVARCHAR(MAX) NULL, -- Encrypted
    AccessToken NVARCHAR(MAX) NULL, -- Encrypted
    RefreshToken NVARCHAR(MAX) NULL, -- Encrypted
    TokenExpiresAt DATETIME2 NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_IntegrationConfigs_Name UNIQUE (Name)
);

-- Sync Logs for tracking integration sync operations
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
    CONSTRAINT FK_SyncLogs_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    CONSTRAINT FK_SyncLogs_Users FOREIGN KEY (CreatedBy) REFERENCES Users(Id)
    -- Note: CreatedBy column name matches BaseEntity.CreatedBy for compatibility
);

-- ============================================
-- Jira Integration Tables
-- ============================================

-- Add Jira fields to existing Activities table (if not exists)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProjectTasks') AND name = 'JiraIssueKey')
BEGIN
    ALTER TABLE ProjectTasks ADD JiraIssueKey NVARCHAR(100) NULL;
    CREATE INDEX IX_ProjectTasks_JiraIssueKey ON ProjectTasks(JiraIssueKey);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ProjectTasks') AND name = 'JiraIssueId')
BEGIN
    ALTER TABLE ProjectTasks ADD JiraIssueId NVARCHAR(100) NULL;
END

-- Jira Projects mapping
CREATE TABLE JiraProjects (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    JiraProjectKey NVARCHAR(100) NOT NULL,
    JiraProjectId NVARCHAR(100) NOT NULL,
    JiraProjectName NVARCHAR(500) NOT NULL,
    LastSyncedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_JiraProjects_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    CONSTRAINT UQ_JiraProjects_ProjectId UNIQUE (ProjectId),
    CONSTRAINT UQ_JiraProjects_JiraProjectKey UNIQUE (JiraProjectKey)
);

-- ============================================
-- Confluence Integration Tables
-- ============================================

CREATE TABLE ConfluencePages (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    PageId NVARCHAR(100) NOT NULL,
    Title NVARCHAR(500) NOT NULL,
    Content NVARCHAR(MAX) NULL, -- Cached content
    Url NVARCHAR(1000) NOT NULL,
    SpaceKey NVARCHAR(100) NULL,
    LastSyncedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ConfluencePages_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    CONSTRAINT UQ_ConfluencePages_PageId UNIQUE (PageId)
);

CREATE INDEX IX_ConfluencePages_ProjectId ON ConfluencePages(ProjectId);

-- ============================================
-- Power BI Integration Tables
-- ============================================

CREATE TABLE PowerBIReports (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProjectId UNIQUEIDENTIFIER NULL,
    ReportId NVARCHAR(200) NOT NULL,
    Name NVARCHAR(500) NOT NULL,
    EmbedUrl NVARCHAR(1000) NULL,
    WorkspaceId NVARCHAR(200) NULL,
    DatasetId NVARCHAR(200) NULL,
    LastSyncedAt DATETIME2 NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_PowerBIReports_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    CONSTRAINT UQ_PowerBIReports_ReportId UNIQUE (ReportId)
);

CREATE INDEX IX_PowerBIReports_ProjectId ON PowerBIReports(ProjectId);

-- ============================================
-- KPI Metrics Tables
-- ============================================

CREATE TABLE KPIMetrics (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    ProjectId UNIQUEIDENTIFIER NOT NULL,
    MetricDate DATE NOT NULL,
    CPI DECIMAL(18, 4) NULL, -- Cost Performance Index
    SPI DECIMAL(18, 4) NULL, -- Schedule Performance Index
    EV DECIMAL(18, 2) NULL, -- Earned Value
    PV DECIMAL(18, 2) NULL, -- Planned Value
    AC DECIMAL(18, 2) NULL, -- Actual Cost
    BAC DECIMAL(18, 2) NULL, -- Budget at Completion
    EAC DECIMAL(18, 2) NULL, -- Estimate at Completion
    ETC DECIMAL(18, 2) NULL, -- Estimate to Complete
    VAC DECIMAL(18, 2) NULL, -- Variance at Completion
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_KPIMetrics_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
    CONSTRAINT UQ_KPIMetrics_ProjectId_Date UNIQUE (ProjectId, MetricDate)
);

CREATE INDEX IX_KPIMetrics_ProjectId ON KPIMetrics(ProjectId);
CREATE INDEX IX_KPIMetrics_MetricDate ON KPIMetrics(MetricDate);

-- ============================================
-- Activity Dependencies (for Gantt Chart)
-- ============================================

-- Dependency Types: 0 = FinishToStart, 1 = StartToStart, 2 = FinishToFinish, 3 = StartToFinish
CREATE TABLE ActivityDependencies (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    PredecessorActivityId UNIQUEIDENTIFIER NOT NULL,
    SuccessorActivityId UNIQUEIDENTIFIER NOT NULL,
    DependencyType INT NOT NULL DEFAULT 0, -- 0: FinishToStart
    Lag INT NOT NULL DEFAULT 0, -- Lag in days
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_ActivityDependencies_Predecessor FOREIGN KEY (PredecessorActivityId) REFERENCES ProjectTasks(Id),
    CONSTRAINT FK_ActivityDependencies_Successor FOREIGN KEY (SuccessorActivityId) REFERENCES ProjectTasks(Id),
    CONSTRAINT CHK_ActivityDependencies_NotSelf CHECK (PredecessorActivityId != SuccessorActivityId)
);

CREATE INDEX IX_ActivityDependencies_Predecessor ON ActivityDependencies(PredecessorActivityId);
CREATE INDEX IX_ActivityDependencies_Successor ON ActivityDependencies(SuccessorActivityId);

-- ============================================
-- Enhanced Role Permissions
-- ============================================

-- Add PMO-specific permissions if RolePermissions table exists
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'RolePermissions')
BEGIN
    -- Insert PMO permissions if not exists
    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'Integrations.Jira.View')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Jira.View' FROM Roles WHERE Name = 'PMOManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Jira.View' FROM Roles WHERE Name = 'ProjectManager';
    END

    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'Integrations.Jira.Sync')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Jira.Sync' FROM Roles WHERE Name = 'PMOManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Jira.Sync' FROM Roles WHERE Name = 'ProjectManager';
    END

    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'Integrations.Confluence.View')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Confluence.View' FROM Roles WHERE Name = 'PMOManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Confluence.View' FROM Roles WHERE Name = 'ProjectManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.Confluence.View' FROM Roles WHERE Name = 'Viewer';
    END

    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'Integrations.PowerBI.View')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.PowerBI.View' FROM Roles WHERE Name = 'PMOManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Integrations.PowerBI.View' FROM Roles WHERE Name = 'ProjectManager';
    END

    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'Reports.PMO.Generate')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'Reports.PMO.Generate' FROM Roles WHERE Name = 'PMOManager';
    END

    IF NOT EXISTS (SELECT * FROM RolePermissions WHERE Permission = 'KPIs.View')
    BEGIN
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'KPIs.View' FROM Roles WHERE Name = 'PMOManager';
        INSERT INTO RolePermissions (RoleId, Permission)
        SELECT Id, 'KPIs.View' FROM Roles WHERE Name = 'ProjectManager';
    END
END

-- ============================================
-- Seed Data for PMO Roles
-- ============================================

-- Ensure PMO roles exist
IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'PMOManager')
BEGIN
    INSERT INTO Roles (Id, Name, Description)
    VALUES (NEWID(), 'PMOManager', 'PMO Manager with full access to all PMO features');
END

IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'ProjectManager')
BEGIN
    INSERT INTO Roles (Id, Name, Description)
    VALUES (NEWID(), 'ProjectManager', 'Project Manager with access to project management features');
END

IF NOT EXISTS (SELECT * FROM Roles WHERE Name = 'Viewer')
BEGIN
    INSERT INTO Roles (Id, Name, Description)
    VALUES (NEWID(), 'Viewer', 'View-only access to projects and documents');
END

-- ============================================
-- Views for Reporting
-- ============================================

-- View for Project KPI Summary
CREATE OR ALTER VIEW vw_ProjectKPISummary AS
SELECT 
    p.Id AS ProjectId,
    p.Code AS ProjectCode,
    p.Name AS ProjectName,
    p.Status AS ProjectStatus,
    p.StartDate,
    p.EndDate,
    p.Budget,
    k.CPI,
    k.SPI,
    k.EV,
    k.PV,
    k.AC,
    k.MetricDate,
    DATEDIFF(DAY, p.StartDate, GETUTCDATE()) AS DaysElapsed,
    DATEDIFF(DAY, p.StartDate, p.EndDate) AS TotalDays,
    CASE 
        WHEN p.EndDate IS NOT NULL AND GETUTCDATE() > p.EndDate THEN 1
        ELSE 0
    END AS IsOverdue
FROM Projects p
LEFT JOIN (
    SELECT 
        ProjectId,
        CPI,
        SPI,
        EV,
        PV,
        AC,
        MetricDate,
        ROW_NUMBER() OVER (PARTITION BY ProjectId ORDER BY MetricDate DESC) AS rn
    FROM KPIMetrics
) k ON p.Id = k.ProjectId AND k.rn = 1;

-- View for Integration Sync Status
CREATE OR ALTER VIEW vw_IntegrationSyncStatus AS
SELECT 
    sl.Id,
    sl.IntegrationType,
    CASE sl.IntegrationType
        WHEN 0 THEN 'Jira'
        WHEN 1 THEN 'Confluence'
        WHEN 2 THEN 'PowerBI'
        ELSE 'Unknown'
    END AS IntegrationName,
    sl.ProjectId,
    p.Name AS ProjectName,
    sl.Status,
    CASE sl.Status
        WHEN 0 THEN 'Success'
        WHEN 1 THEN 'Failed'
        WHEN 2 THEN 'InProgress'
        ELSE 'Unknown'
    END AS StatusName,
    sl.StartTime,
    sl.EndTime,
    DATEDIFF(SECOND, sl.StartTime, ISNULL(sl.EndTime, GETUTCDATE())) AS DurationSeconds,
    sl.RecordsSynced,
    sl.ErrorMessage,
    u.FullName AS CreatedByName
FROM SyncLogs sl
LEFT JOIN Projects p ON sl.ProjectId = p.Id
LEFT JOIN Users u ON sl.CreatedBy = u.Id;

