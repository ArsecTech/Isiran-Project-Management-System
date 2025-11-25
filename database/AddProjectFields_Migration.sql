-- Migration: Add new fields to Projects and Tasks tables
-- Run this script to add new fields for project management enhancements

-- Add new fields to Projects table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'Nature')
BEGIN
    ALTER TABLE Projects ADD Nature INT NOT NULL DEFAULT 0; -- 0: DesignAndImplementation, 1: Support, 2: Development, 3: Procurement
    PRINT 'Nature column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'Nature column already exists in Projects table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'Center')
BEGIN
    ALTER TABLE Projects ADD Center NVARCHAR(200) NULL;
    PRINT 'Center column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'Center column already exists in Projects table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'SelfReportedProgress')
BEGIN
    ALTER TABLE Projects ADD SelfReportedProgress INT NULL;
    PRINT 'SelfReportedProgress column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'SelfReportedProgress column already exists in Projects table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'ApprovedProgress')
BEGIN
    ALTER TABLE Projects ADD ApprovedProgress INT NULL;
    PRINT 'ApprovedProgress column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'ApprovedProgress column already exists in Projects table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'LastUpdatedByExecutor')
BEGIN
    ALTER TABLE Projects ADD LastUpdatedByExecutor DATETIME2 NULL;
    PRINT 'LastUpdatedByExecutor column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'LastUpdatedByExecutor column already exists in Projects table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Projects') AND name = 'LastApprovedByClient')
BEGIN
    ALTER TABLE Projects ADD LastApprovedByClient DATETIME2 NULL;
    PRINT 'LastApprovedByClient column added to Projects table.';
END
ELSE
BEGIN
    PRINT 'LastApprovedByClient column already exists in Projects table.';
END

-- Add new fields to Tasks table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tasks') AND name = 'SelfReportedProgress')
BEGIN
    ALTER TABLE Tasks ADD SelfReportedProgress INT NULL;
    PRINT 'SelfReportedProgress column added to Tasks table.';
END
ELSE
BEGIN
    PRINT 'SelfReportedProgress column already exists in Tasks table.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Tasks') AND name = 'ApprovedProgress')
BEGIN
    ALTER TABLE Tasks ADD ApprovedProgress INT NULL;
    PRINT 'ApprovedProgress column added to Tasks table.';
END
ELSE
BEGIN
    PRINT 'ApprovedProgress column already exists in Tasks table.';
END

-- Create indexes for better performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Projects_Nature' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE INDEX IX_Projects_Nature ON Projects(Nature);
    PRINT 'Index IX_Projects_Nature created.';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Projects_Center' AND object_id = OBJECT_ID('Projects'))
BEGIN
    CREATE INDEX IX_Projects_Center ON Projects(Center);
    PRINT 'Index IX_Projects_Center created.';
END

PRINT 'Migration completed successfully!';

