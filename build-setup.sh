#!/bin/bash
# ============================================================
# Build Portable Setup Package
# ساخت پکیج نصبی قابل حمل
# ============================================================

set -e

echo "================================================"
echo "  🔨 Building Portable Setup Package"
echo "  ساخت پکیج نصبی قابل حمل"
echo "================================================"
echo ""

# Step 1: Build Next.js
echo "📋 Step 1: Building Next.js application..."
bun run build 2>&1 | tail -5
echo "  ✅ Next.js build complete"

# Step 2: Copy standalone to dist folder
echo ""
echo "📋 Step 2: Creating portable package..."
DIST_DIR="GasStationManager-Portable"
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR/app"
mkdir -p "$DIST_DIR/app/.next"
mkdir -p "$DIST_DIR/app/public"
mkdir -p "$DIST_DIR/app/prisma"
mkdir -p "$DIST_DIR/app/db"

# Copy standalone server
cp -r .next/standalone/* "$DIST_DIR/app/"
cp -r .next/static "$DIST_DIR/app/.next/"
cp -r public/* "$DIST_DIR/app/public/" 2>/dev/null || true
cp -r prisma/* "$DIST_DIR/app/prisma/"
cp package.json "$DIST_DIR/app/"

# Copy database
cp db/custom.db "$DIST_DIR/app/db/" 2>/dev/null || true

echo "  ✅ Application files copied"

# Step 3: Create start scripts
echo ""
echo "📋 Step 3: Creating start scripts..."

# Windows start script
cat > "$DIST_DIR/Start-GasStationManager.bat" << 'BATEOF'
@echo off
title Gas Station Manager - سیستم مدیریت تانک تیل
cd /d "%~dp0\app"

echo ================================================================
echo   ⛽ Gas Station Manager - Starting...
echo   سیستم مدیریت تانک تیل - در حال شروع...
echo ================================================================
echo.

REM Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    echo لطفاً Node.js را نصب کنید
    pause
    exit /b 1
)

REM Set environment
set NODE_ENV=production
set PORT=3000
set DATABASE_URL=file:%~dp0app\db\gas-station.db

REM Copy database if not exists
if not exist "db\gas-station.db" (
    if exist "db\custom.db" (
        copy "db\custom.db" "db\gas-station.db" >nul
    )
)

REM Start the server
echo 🚀 Starting server on port 3000...
start /b node server.js

REM Wait for server to start
timeout /t 3 /nobreak >nul

REM Open browser
echo 🌐 Opening browser...
start "" "http://localhost:3000"

echo.
echo ✅ System is running!
echo    سیستم فعال است!
echo.
echo 📌 Browser: http://localhost:3000
echo 📌 To stop: Close this window or press Ctrl+C
echo.
echo ================================================================

REM Keep window open
cmd /k
BATEOF

# Windows stop script
cat > "$DIST_DIR/Stop-GasStationManager.bat" << 'BATEOF'
@echo off
echo Stopping Gas Station Manager...
taskkill /f /im node.exe 2>nul
echo ✅ System stopped
timeout /t 2 /nobreak >nul
BATEOF

# Linux/Mac start script
cat > "$DIST_DIR/Start-GasStationManager.sh" << 'SHEOF'
#!/bin/bash
cd "$(dirname "$0")/app"
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="file:$(pwd)/db/gas-station.db"

# Copy database if not exists
if [ ! -f "db/gas-station.db" ]; then
    if [ -f "db/custom.db" ]; then
        cp "db/custom.db" "db/gas-station.db"
    fi
fi

echo "🚀 Starting Gas Station Manager..."
node server.js &
SERVER_PID=$!

sleep 3

# Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000"
elif command -v open &> /dev/null; then
    open "http://localhost:3000"
fi

echo "✅ System is running at http://localhost:3000"
echo "Press Ctrl+C to stop"
wait $SERVER_PID
SHEOF
chmod +x "$DIST_DIR/Start-GasStationManager.sh"

# Create install shortcut script for Windows
cat > "$DIST_DIR/Install-Shortcuts.bat" << 'BATEOF'
@echo off
title Install Shortcuts - Gas Station Manager
echo ================================================================
echo   📌 Installing Desktop & Start Menu Shortcuts
echo   نصب میان‌برهای دسکتاپ و منوی استارت
echo ================================================================
echo.

set "APP_PATH=%~dp0Start-GasStationManager.bat"
set "APP_DIR=%~dp0"

REM Create desktop shortcut
set "DESKTOP=%USERPROFILE%\Desktop"
if exist "%DESKTOP%" (
    echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_shortcut.vbs"
    echo sLinkFile = "%DESKTOP%\Gas Station Manager.lnk" >> "%TEMP%\create_shortcut.vbs"
    echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_shortcut.vbs"
    echo oLink.TargetPath = "%APP_PATH%" >> "%TEMP%\create_shortcut.vbs"
    echo oLink.WorkingDirectory = "%APP_DIR%" >> "%TEMP%\create_shortcut.vbs"
    echo oLink.Description = "Gas Station Manager - سیستم مدیریت تانک تیل" >> "%TEMP%\create_shortcut.vbs"
    echo oLink.IconLocation = "%APP_DIR%app\public\logo.svg" >> "%TEMP%\create_shortcut.vbs"
    echo oLink.Save >> "%TEMP%\create_shortcut.vbs"
    cscript /nologo "%TEMP%\create_shortcut.vbs"
    del "%TEMP%\create_shortcut.vbs"
    echo ✅ Desktop shortcut created
) else (
    echo ⚠️ Desktop folder not found
)

REM Create start menu shortcut
set "STARTMENU=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Gas Station Manager"
if not exist "%STARTMENU%" mkdir "%STARTMENU%"

echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_startmenu.vbs"
echo sLinkFile = "%STARTMENU%\Gas Station Manager.lnk" >> "%TEMP%\create_startmenu.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_startmenu.vbs"
echo oLink.TargetPath = "%APP_PATH%" >> "%TEMP%\create_startmenu.vbs"
echo oLink.WorkingDirectory = "%APP_DIR%" >> "%TEMP%\create_startmenu.vbs"
echo oLink.Description = "Gas Station Manager - سیستم مدیریت تانک تیل" >> "%TEMP%\create_startmenu.vbs"
echo oLink.Save >> "%TEMP%\create_startmenu.vbs"
cscript /nologo "%TEMP%\create_startmenu.vbs"
del "%TEMP%\create_startmenu.vbs"
echo ✅ Start Menu shortcut created

REM Create uninstaller
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\create_uninstall.vbs"
echo sLinkFile = "%STARTMENU%\Uninstall.lnk" >> "%TEMP%\create_uninstall.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\create_uninstall.vbs"
echo oLink.TargetPath = "cmd.exe" >> "%TEMP%\create_uninstall.vbs"
echo oLink.Arguments = "/c rmdir /s /q \"%STARTMENU%\" & del \"%DESKTOP%\Gas Station Manager.lnk\"" >> "%TEMP%\create_uninstall.vbs"
echo oLink.Save >> "%TEMP%\create_uninstall.vbs"
cscript /nologo "%TEMP%\create_uninstall.vbs"
del "%TEMP%\create_uninstall.vbs"

echo.
echo ================================================================
echo   ✅ Installation Complete!
echo   نصب کامل شد!
echo ================================================================
echo.
echo 📌 Desktop shortcut: "Gas Station Manager"
echo 📌 Start Menu: Gas Station Manager folder
echo.
echo 🚀 Double-click the desktop shortcut to start the system
echo    برای شروع سیستم، روی آیکون دسکتاپ دبل‌کلیک کنید
echo.
pause
BATEOF

# Create README
cat > "$DIST_DIR/README-INSTALL.txt" << 'READMEEOF'
============================================================
  ⛽ Gas Station Manager - Installation Guide
  سیستم مدیریت تانک تیل - راهنمای نصب
============================================================

PREREQUISITES | پیش‌نیازها:
1. Install Node.js from https://nodejs.org/ (LTS version)
2. Node.js را از سایت فوق نصب کنید

INSTALLATION | نصب:

Option 1 - Quick Install (Recommended):
1. Double-click "Install-Shortcuts.bat"
2. Desktop and Start Menu shortcuts will be created
3. Double-click "Gas Station Manager" on desktop to start

Option 2 - Manual Start:
1. Double-click "Start-GasStationManager.bat"
2. Wait for browser to open automatically
3. System runs at http://localhost:3000

TO STOP | برای توقف:
- Double-click "Stop-GasStationManager.bat"
- Or close the command window

DATA BACKUP | بکاپ معلومات:
- Use Settings → Export Backup inside the app
- Database is stored in: app/db/gas-station.db

============================================================
