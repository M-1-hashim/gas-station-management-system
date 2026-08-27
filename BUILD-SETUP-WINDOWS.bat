@echo off
title Build Gas Station Manager Setup.exe
color 0A

echo ================================================================
echo   🔨 Build Real Setup.exe Installer for Windows
echo   ساخت نصب‌کننده واقعی Setup.exe برای ویندوز
echo ================================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Bun is installed
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Bun not found!
    echo Please install Bun:
    echo   powershell -c "irm bun.sh/install.ps1 ^| iex"
    pause
    exit /b 1
)

echo ✅ Prerequisites found
echo.

REM Step 1: Install dependencies
echo ================================================================
echo   Step 1: Installing dependencies...
echo ================================================================
call bun install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Step 2: Install Electron
echo ================================================================
echo   Step 2: Installing Electron...
echo ================================================================
call npm install -d electron electron-builder concurrently wait-on
if %errorlevel% neq 0 (
    echo ❌ Failed to install Electron
    pause
    exit /b 1
)
echo ✅ Electron installed
echo.

REM Step 3: Build Next.js
echo ================================================================
echo   Step 3: Building Next.js application...
echo ================================================================
call bun run build
if %errorlevel% neq 0 (
    echo ❌ Next.js build failed
    pause
    exit /b 1
)
echo ✅ Next.js build complete
echo.

REM Step 4: Copy static files to standalone
echo ================================================================
echo   Step 4: Copying static files...
echo ================================================================
xcopy /E /I /Y ".next\static" ".next\standalone\.next\static" >nul
xcopy /E /I /Y "public" ".next\standalone\public" >nul
echo ✅ Static files copied
echo.

REM Step 5: Build Electron installer
echo ================================================================
echo   Step 5: Building Setup.exe installer...
echo   ساخت نصب‌کننده Setup.exe...
echo   This may take several minutes...
echo   این ممکن است چند دقیقه طول بکشد...
echo ================================================================
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo ❌ electron-builder failed
    echo Trying alternative build...
    call npx electron-builder --win --config.npmRebuild=false
)
echo.

REM Check if installer was created
if exist "dist-electron\*.exe" (
    echo ================================================================
    echo   ✅ SUCCESS! Setup.exe created!
    echo   نصب‌کننده با موفقیت ساخته شد!
    echo ================================================================
    echo.
    echo 📁 Location: dist-electron\ folder
    echo 📄 File: GasStationManager-Setup-1.0.0.exe
    echo.
    echo 📌 To install: Double-click the .exe file
    echo    برای نصب: روی فایل .exe دبل‌کلیک کنید
    echo.
    explorer "dist-electron"
) else (
    echo ❌ Setup.exe was not created
    echo Check the error messages above
    echo.
    echo Alternative: Use the Portable version instead
    echo Run build-setup.sh to create a portable package
)

echo.
pause
