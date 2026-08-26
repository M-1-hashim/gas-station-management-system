@echo off
REM ============================================================
REM  Gas Station Management System - Windows Installer
REM  سیستم مدیریت تانک تیل - نصب برای ویندوز
REM ============================================================

echo ================================================
echo   ⛽ Gas Station Management System Installer
echo   سیستم مدیریت تانک تیل - نصب خودکار
echo ================================================
echo.

REM Step 1: Check Node.js
echo Step 1: Checking Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
    echo   ✅ Node.js found: %NODE_VERSION%
) else (
    echo   ❌ Node.js not found!
    echo   Please install Node.js from: https://nodejs.org/
    echo   لطفاً Node.js را از سایت فوق نصب کنید
    pause
    exit /b 1
)

REM Step 2: Check Bun
echo.
echo Step 2: Checking Bun runtime...
where bun >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('bun -v') do set BUN_VERSION=%%v
    echo   ✅ Bun found: %BUN_VERSION%
) else (
    echo   ⚠️  Bun not found.
    echo   Please install Bun by running this in PowerShell:
    echo     powershell -c "irm bun.sh/install.ps1 ^| iex"
    echo.
    echo   Or download from: https://bun.sh/
    echo.
    set /p INSTALL_BUN="Do you want to try installing Bun now? (y/n): "
    if /i "%INSTALL_BUN%"=="y" (
        powershell -c "irm bun.sh/install.ps1 | iex"
    ) else (
        echo Please install Bun and run this script again.
        pause
        exit /b 1
    )
)

REM Step 3: Clone Repository
echo.
echo Step 3: Setting up application...
if exist "gas-station-app" (
    echo   📁 Existing installation found. Updating...
    cd gas-station-app
    git pull origin main
) else (
    echo   📥 Cloning repository...
    git clone https://github.com/M-1-hashim/gas-station-management-system.git gas-station-app
    cd gas-station-app
)

REM Step 4: Install Dependencies
echo.
echo Step 4: Installing dependencies...
call bun install
echo   ✅ Dependencies installed

REM Step 5: Setup Database
echo.
echo Step 5: Setting up database...
call bun run db:push
echo   ✅ Database created (SQLite - offline)

REM Step 6: Build
echo.
echo Step 6: Building for production...
call bun run build
echo   ✅ Build complete

REM Create start.bat
echo.
echo Step 7: Creating start script...
(
echo @echo off
echo cd /d "%%~dp0"
echo echo Starting Gas Station Management System...
echo start /b bun run start
echo echo.
echo echo ✅ System is running!
echo echo Open your browser to: http://localhost:3000
echo echo مرورگر خود را باز کنید: http://localhost:3000
echo echo.
echo echo Press Ctrl+C to stop
echo pause
) > start.bat
echo   ✅ start.bat created

REM Create stop.bat
(
echo @echo off
echo echo Stopping Gas Station Management System...
echo taskkill /f /im node.exe 2>nul
echo echo ✅ System stopped
echo pause
) > stop.bat
echo   ✅ stop.bat created

echo.
echo ================================================
echo   ✅ Installation Complete! نصب کامل شد!
echo ================================================
echo.
echo 🚀 To start: Double-click "start.bat"
echo 🌐 Then open: http://localhost:3000
echo ⏹️ To stop: Double-click "stop.bat"
echo.
pause
