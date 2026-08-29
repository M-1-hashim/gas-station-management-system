@echo off
title Update Gas Station Manager - به‌روزرسانی
color 0A

echo ================================================================
echo   🔄 Gas Station Manager - Update
echo   به‌روزرسانی سیستم مدیریت تانک تیل
echo ================================================================
echo.

REM Find install directory
set "INSTALL_DIR=%PROGRAMFILES%\GasStationManager"
if not exist "%INSTALL_DIR%" (
    set "INSTALL_DIR=%LOCALAPPDATA%\GasStationManager"
)
if not exist "%INSTALL_DIR%" (
    echo ❌ Gas Station Manager not found!
    echo Please install the full version first.
    echo لطفاً ابتدا نسخه کامل را نصب کنید
    pause
    exit /b 1
)

echo ✅ Found installation: %INSTALL_DIR%
echo.

REM Stop running instance
echo 📋 Stopping running instance...
taskkill /f /im "Gas Station Manager.exe" 2>nul
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Download update.zip
echo.
echo 📥 Downloading update (88 MB)...
echo    این ممکن است چند دقیقه طول بکشد...

set "UPDATE_ZIP=%TEMP%\gas-station-update.zip"
set "UPDATE_URL=https://github.com/M-1-hashim/gas-station-management-system/releases/download/v1.0.0/update.zip"

REM Use PowerShell to download
powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%UPDATE_URL%' -OutFile '%UPDATE_ZIP%'" 2>nul

if not exist "%UPDATE_ZIP%" (
    echo ❌ Failed to download update!
    echo لطفاً انترنت خود را بررسی کنید
    pause
    exit /b 1
)

echo ✅ Download complete!
echo.

REM Extract update
echo 📦 Extracting update...
set "APP_DIR=%INSTALL_DIR%\resources\app"

REM Backup database
echo 📋 Backing up database...
if exist "%APP_DIR%\db\custom.db" (
    copy "%APP_DIR%\db\custom.db" "%TEMP%\gas-station-db-backup.db" >nul
    echo ✅ Database backed up
)

REM Extract using PowerShell
powershell -Command "Expand-Archive -Path '%UPDATE_ZIP%' -DestinationPath '%APP_DIR%' -Force" 2>nul

if %errorlevel% neq 0 (
    echo ❌ Failed to extract update!
    pause
    exit /b 1
)

echo ✅ Update extracted!

REM Restore database
echo 📋 Restoring database...
if exist "%TEMP%\gas-station-db-backup.db" (
    copy "%TEMP%\gas-station-db-backup.db" "%APP_DIR%\db\custom.db" >nul
    echo ✅ Database restored
)

REM Clean up
del "%UPDATE_ZIP%" 2>nul

echo.
echo ================================================================
echo   ✅ Update Complete! به‌روزرسانی کامل شد!
echo ================================================================
echo.
echo 🚀 You can now launch Gas Station Manager from desktop.
echo    حالا می‌توانید برنامه را از دسکتاپ اجرا کنید
echo.
pause
