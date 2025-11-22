-- =============================================
-- Migrate ProjectSettings from separate columns to JSON
-- =============================================

USE [IsiranDB]
GO

-- Check if Settings column exists, if not add it
IF NOT EXISTS (
    SELECT * FROM sys.columns 
    WHERE object_id = OBJECT_ID('Projects') 
    AND name = 'Settings'
)
BEGIN
    -- Add Settings column as NVARCHAR(MAX) for JSON storage
    ALTER TABLE [Projects]
    ADD [Settings] NVARCHAR(MAX) NULL;
END
GO

-- Migrate existing data from separate columns to JSON
UPDATE [Projects]
SET [Settings] = (
    SELECT 
        [AutoSchedule] AS AutoSchedule,
        [CriticalPathEnabled] AS CriticalPathEnabled,
        [ResourceLevelingEnabled] AS ResourceLevelingEnabled,
        [WorkingHoursPerDay] AS WorkingHoursPerDay,
        [WorkingDaysPerWeek] AS WorkingDaysPerWeek,
        [CalendarId] AS CalendarId,
        [AllowOvertime] AS AllowOvertime,
        [DefaultHourlyRate] AS DefaultHourlyRate,
        [Currency] AS Currency,
        [TimeZone] AS TimeZone
    FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
)
WHERE [Settings] IS NULL;
GO

-- Set default JSON for projects without settings
UPDATE [Projects]
SET [Settings] = '{"AutoSchedule":true,"CriticalPathEnabled":true,"ResourceLevelingEnabled":true,"WorkingHoursPerDay":8,"WorkingDaysPerWeek":5,"CalendarId":"Standard","AllowOvertime":false,"DefaultHourlyRate":0,"Currency":"USD","TimeZone":"UTC"}'
WHERE [Settings] IS NULL;
GO

-- Optional: Drop old columns after migration (uncomment if you want to remove them)
/*
ALTER TABLE [Projects] DROP COLUMN [AutoSchedule];
ALTER TABLE [Projects] DROP COLUMN [CriticalPathEnabled];
ALTER TABLE [Projects] DROP COLUMN [ResourceLevelingEnabled];
ALTER TABLE [Projects] DROP COLUMN [WorkingHoursPerDay];
ALTER TABLE [Projects] DROP COLUMN [WorkingDaysPerWeek];
ALTER TABLE [Projects] DROP COLUMN [CalendarId];
ALTER TABLE [Projects] DROP COLUMN [AllowOvertime];
ALTER TABLE [Projects] DROP COLUMN [DefaultHourlyRate];
ALTER TABLE [Projects] DROP COLUMN [Currency];
ALTER TABLE [Projects] DROP COLUMN [TimeZone];
*/
GO

PRINT 'Migration completed successfully!'
GO

