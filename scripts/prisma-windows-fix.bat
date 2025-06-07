@echo off
setlocal enabledelayedexpansion

echo 🔧 Windows Prisma Fix Script (Batch Version)
echo.

set "PRISMA_DIR=%~dp0..\node_modules\.prisma\client"
set "QUERY_ENGINE=%PRISMA_DIR%\query_engine-windows.dll.node"

echo 📁 Prisma client directory: %PRISMA_DIR%
echo 🔧 Query engine file: %QUERY_ENGINE%
echo.

REM Function to kill processes using the file
echo 🔍 Checking for processes that might be locking files...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im prisma.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Clean up temporary files
echo 🧹 Cleaning up temporary files...
if exist "%PRISMA_DIR%" (
    del /f /q "%PRISMA_DIR%\query_engine-windows.dll.node.tmp*" >nul 2>&1
    del /f /q "%PRISMA_DIR%\libquery_engine-*.so.tmp*" >nul 2>&1
    del /f /q "%PRISMA_DIR%\query_engine-*.dylib.tmp*" >nul 2>&1
    echo ✅ Temporary files cleaned
) else (
    echo ℹ️  Prisma client directory not found
)

REM Try to remove the main query engine file
if exist "%QUERY_ENGINE%" (
    echo 🗑️  Attempting to remove existing query engine file...
    
    REM Method 1: Standard deletion
    del /f /q "%QUERY_ENGINE%" >nul 2>&1
    if not exist "%QUERY_ENGINE%" (
        echo ✅ Successfully removed query engine file
        goto :generate
    )
    
    REM Method 2: Remove read-only attribute and try again
    attrib -r "%QUERY_ENGINE%" >nul 2>&1
    del /f /q "%QUERY_ENGINE%" >nul 2>&1
    if not exist "%QUERY_ENGINE%" (
        echo ✅ Successfully removed query engine file after clearing attributes
        goto :generate
    )
    
    REM Method 3: Move to backup location
    set "BACKUP_FILE=%QUERY_ENGINE%.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    move "%QUERY_ENGINE%" "%BACKUP_FILE%" >nul 2>&1
    if not exist "%QUERY_ENGINE%" (
        echo ✅ Successfully moved query engine file to backup
        goto :generate
    )
    
    REM Method 4: Move entire .prisma directory
    echo ⚠️  Could not remove query engine file, trying to move entire .prisma directory...
    set "PRISMA_PARENT=%~dp0..\node_modules\.prisma"
    set "BACKUP_DIR=%PRISMA_PARENT%.backup.%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
    move "%PRISMA_PARENT%" "%BACKUP_DIR%" >nul 2>&1
    if not exist "%PRISMA_PARENT%" (
        echo ✅ Successfully moved .prisma directory to backup
    ) else (
        echo ⚠️  Could not move .prisma directory - Prisma will attempt to work around this
    )
)

:generate
echo.
echo 🔧 Generating Prisma client...

REM Set environment variables for better Windows compatibility
set CHECKPOINT_DISABLE=1
set PRISMA_GENERATE_SKIP_AUTOINSTALL=false
set PRISMA_QUERY_ENGINE_BINARY=query-engine
set PRISMA_SCHEMA_ENGINE_BINARY=schema-engine

REM Try multiple approaches
set "ATTEMPTS=0"
set "MAX_ATTEMPTS=5"

:retry
set /a ATTEMPTS+=1
echo.
echo 🔄 Attempt %ATTEMPTS%/%MAX_ATTEMPTS%

if %ATTEMPTS% LEQ 2 (
    echo 📦 Using npx prisma generate...
    npx prisma generate
) else if %ATTEMPTS% LEQ 4 (
    echo 🌐 Using global prisma generate...
    prisma generate
) else (
    echo 🔧 Using NAPI engine...
    set PRISMA_FORCE_NAPI=1
    prisma generate
)

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Prisma client generated successfully!
    goto :success
)

echo ❌ Attempt %ATTEMPTS% failed with error level %ERRORLEVEL%

if %ATTEMPTS% LSS %MAX_ATTEMPTS% (
    echo ⏳ Waiting before retry...
    timeout /t 3 /nobreak >nul
    
    REM Clean up again before retry
    if exist "%PRISMA_DIR%" (
        del /f /q "%PRISMA_DIR%\query_engine-windows.dll.node.tmp*" >nul 2>&1
    )
    
    goto :retry
)

echo.
echo ❌ Failed to generate Prisma client after %MAX_ATTEMPTS% attempts
echo.
echo 🔧 Troubleshooting suggestions:
echo    1. Close any IDEs or editors that might be locking files
echo    2. Run this script as Administrator
echo    3. Temporarily disable antivirus software
echo    4. Try running: npm run clean ^&^& npm install
echo.
exit /b 1

:success
echo.
echo 🎉 Prisma client generation completed successfully!
echo.
exit /b 0
