# 📦 راهنمای ساخت Setup.exe | د Setup.exe جوړولو لارښود

# ساخت نصب‌کننده واقعی برای ویندوز

---

## 🇦🇫 دری (Dari)

### روش 1: استفاده از پکیج آماده (سریع‌ترین)

1. فایل `GasStationManager-Setup.zip` را دانلود کنید
2. آن را از حالت فشرده خارج کنید (Extract)
3. وارد پوشه `GasStationManager-Portable` شوید
4. روی فایل `Install-Shortcuts.bat` دبل‌کلیک کنید
   - این میان‌بر دسکتاپ و منوی استارت را ایجاد می‌کند
5. روی آیکون **Gas Station Manager** در دسکتاپ دبل‌کلیک کنید
6. مرورگر خودکار باز می‌شود: `http://localhost:3000`

**پیش‌نیاز:** فقط Node.js را از https://nodejs.org/ نصب کنید

---

### روش 2: ساخت Setup.exe واقعی (حرفه‌ای)

برای ساخت یک نصب‌کننده واقعی (.exe) که مثل برنامه‌های عادی نصب می‌شود:

1. **پروژه را دانلود کنید:**
   ```bash
   git clone https://github.com/M-1-hashim/gas-station-management-system.git
   cd gas-station-management-system
   ```

2. **Node.js و Bun را نصب کنید:**
   - Node.js: از https://nodejs.org/
   - Bun: در PowerShell اجرا کنید:
     ```powershell
     powershell -c "irm bun.sh/install.ps1 | iex"
     ```

3. **فایل `BUILD-SETUP-WINDOWS.bat` را دبل‌کلیک کنید**
   - این اسکریپت خودکار تمام چیزها را نصب و Setup.exe می‌سازد
   - فایل نصب‌کننده در پوشه `dist-electron` ساخته می‌شود

4. **نصب برنامه:**
   - فایل `GasStationManager-Setup-1.0.0.exe` را دبل‌کلیک کنید
   - مثل برنامه‌های عادی نصب می‌شود
   - میان‌بر دسکتاپ و منوی استارت ایجاد می‌شود

---

## 🇬🇧 English

### Option 1: Use Pre-built Package (Fastest)

1. Download `GasStationManager-Setup.zip`
2. Extract the ZIP file
3. Enter the `GasStationManager-Portable` folder
4. Double-click `Install-Shortcuts.bat`
   - This creates desktop and start menu shortcuts
5. Double-click **Gas Station Manager** icon on desktop
6. Browser opens automatically: `http://localhost:3000`

**Prerequisite:** Only install Node.js from https://nodejs.org/

---

### Option 2: Build Real Setup.exe (Professional)

To build a real installer (.exe) like normal Windows software:

1. **Clone the project:**
   ```bash
   git clone https://github.com/M-1-hashim/gas-station-management-system.git
   cd gas-station-management-system
   ```

2. **Install Node.js and Bun:**
   - Node.js: https://nodejs.org/
   - Bun: In PowerShell:
     ```powershell
     powershell -c "irm bun.sh/install.ps1 | iex"
     ```

3. **Double-click `BUILD-SETUP-WINDOWS.bat`**
   - This script automatically installs everything and builds Setup.exe
   - The installer will be in the `dist-electron` folder

4. **Install the application:**
   - Double-click `GasStationManager-Setup-1.0.0.exe`
   - It installs like normal Windows software
   - Desktop shortcut and Start Menu entry are created

---

## 📋 What the Setup.exe Does

| Feature | Description |
|---------|-------------|
| ✅ Desktop Shortcut | Creates shortcut on desktop |
| ✅ Start Menu | Adds to Start Menu programs |
| ✅ Choose Location | Lets user choose install directory |
| ✅ Uninstaller | Creates uninstaller in Control Panel |
| ✅ Auto Start | Option to start after installation |
| ✅ Offline | Works completely offline |
| ✅ Local Database | SQLite database stored locally |

---

## 🔧 Build Commands

| Command | Description |
|---------|-------------|
| `BUILD-SETUP-WINDOWS.bat` | Build Setup.exe on Windows |
| `build-setup.sh` | Build portable package (any OS) |
| `bun run electron:dev` | Run in development mode with Electron |
| `bun run electron:build` | Build Windows installer |
| `bun run electron:build:mac` | Build Mac installer (.dmg) |
| `bun run electron:build:linux` | Build Linux installer (.AppImage) |

---

## ⚠️ Important Notes

1. **Build on Target OS**: For best results, build the .exe on Windows, .dmg on Mac
2. **Node.js Required**: Even with Setup.exe, Node.js must be installed
3. **Port 3000**: The app uses port 3000
4. **Firewall**: Allow Node.js through Windows Firewall if prompted
5. **Antivirus**: Some antiviruses may flag electron apps - add to exceptions

---

## ❓ Troubleshooting

### "node: command not found" after install
- Restart your computer after installing Node.js
- Or add Node.js to your PATH manually

### Port 3000 already in use
```bash
# Find process using port 3000
netstat -ano | findstr :3000
# Kill it (replace PID)
taskkill /PID <PID> /F
```

### electron-builder fails
- Make sure you have Visual Studio Build Tools installed
- Or run: `npx electron-builder --win --config.npmRebuild=false`
