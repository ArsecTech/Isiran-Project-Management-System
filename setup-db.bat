@echo off
echo ========================================
echo Setting up Database
echo ========================================
echo.

cd /d "%~dp0database"

echo Executing Schema_Fixed.sql...
sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -C -i Schema_Fixed.sql
if %errorlevel% neq 0 (
    echo Error executing Schema_Fixed.sql
    exit /b 1
)
echo Schema created successfully!
echo.

echo Executing SeedData.sql...
sqlcmd -S 193.151.145.179 -U ArsecTech -P @12345yDj -C -i SeedData.sql
if %errorlevel% neq 0 (
    echo Error executing SeedData.sql
    exit /b 1
)
echo Seed data inserted successfully!
echo.

echo ========================================
echo Database Setup Complete!
echo ========================================
echo.
echo Test Users:
echo   - admin / Admin@123
echo   - pm1 / Admin@123
echo   - user1 / Admin@123
echo.

