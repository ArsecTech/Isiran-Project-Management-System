@echo off
cd /d "%~dp0"
"C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\SQLCMD.EXE" -S 193.151.145.179 -U ArsecTech -P "@12345yDj" -d IsiranDB -C -i "database\AddOrganizations_Migration.sql"
if %ERRORLEVEL% EQU 0 (
    echo Migration completed successfully!
) else (
    echo Migration failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

