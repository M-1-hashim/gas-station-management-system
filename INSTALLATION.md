# 📖 راهنمای نصب | د نصب لارښود | Installation Guide

# سیستم مدیریت تانک تیل - نصب روی کامپیوتر

---

## 🇦🇫 دری (Dari)

### پیش‌نیازها

قبل از نصب سیستم، باید دو برنامه زیر را روی کامپیوتر خود نصب کنید:

#### 1. نصب Node.js
- به سایت https://nodejs.org/ بروید
- نسخه **LTS** را دانلود و نصب کنید
- بعد از نصب، کامپیوتر را ری‌استارت کنید

#### 2. نصب Bun
- **ویندوز**: PowerShell را باز کنید و این دستور را اجرا کنید:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **مک/لینوکس**: ترمینال را باز کنید و اجرا کنید:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### روش نصب

#### گزینه 1: نصب خودکار (پیشنهادی)

**ویندوز:**
- فایل `install.bat` را دانلود کنید
- روی آن دبل‌کلیک کنید و دستورالعمل‌ها را دنبال کنید

**مک/لینوکس:**
- ترمینال را باز کنید و اجرا کنید:
  ```bash
  chmod +x install.sh
  ./install.sh
  ```

#### گزینه 2: نصب دستی

1. **دانلود پروژه:**
   ```bash
   git clone https://github.com/M-1-hashim/gas-station-management-system.git
   cd gas-station-management-system
   ```

2. **نصب وابستگی‌ها:**
   ```bash
   bun install
   ```

3. **ایجاد دیتابیس:**
   ```bash
   bun run db:push
   ```

4. **ساخت نسخه تولیدی:**
   ```bash
   bun run build
   ```

5. **اجرا:**
   ```bash
   bun run start
   ```

6. **مرورگر را باز کنید:** `http://localhost:3000`

### روش اجرای روزانه

بعد از نصب، برای اجرای روزانه سیستم:

**ویندوز:**
- فایل `start.bat` را دبل‌کلیک کنید

**مک/لینوکس:**
```bash
./start.sh
```

سپس مرورگر را باز کنید: `http://localhost:3000`

### اجرای خودکار هنگام روشن شدن کامپیوتر

```bash
npm install -g pm2
pm2 start "bun run start" --name gas-station
pm2 save
pm2 startup
```

---

## 🇦🇫 پښتو (Pashto)

### مخکینی اړتیاوې

د سیسټم نصبولو دمخه، دا دوه پروګرامونه په خپل کمپیوټر کې نصب کړئ:

#### 1. د Node.js نصب
- سایټ https://nodejs.org/ ته ولاړ شئ
- **LTS** نسخه ډاونلوډ او نصب کړئ
- نصب وروسته کمپیوټر بیا پیل کړئ

#### 2. د Bun نصب
- **وینډوز**: PowerShell پرانیزئ او دا فرمان چلولئ:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **میک/لینکس**: ټرمینال پرانیزئ او چلولئ:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### د نصب طریقه

#### گزینه 1: خودکار نصب (وړاندیز شوی)

**وینډوز:**
- `install.bat` فایل ډاونلوډ کړئ
- پرې دوچل کلیک وکړئ او لارښوونې تعقیب کړئ

**میک/لینکس:**
- ټرمینال پرانیزئ او چلولئ:
  ```bash
  chmod +x install.sh
  ./install.sh
  ```

#### گزینه 2: لاسي نصب

1. **د پروژې ډاونلوډ:**
   ```bash
   git clone https://github.com/M-1-hashim/gas-station-management-system.git
   cd gas-station-management-system
   ```

2. **د اړتیاوو نصب:**
   ```bash
   bun install
   ```

3. **د ډیټابیس جوړول:**
   ```bash
   bun run db:push
   ```

4. **د تولید نسخه جوړول:**
   ```bash
   bun run build
   ```

5. **چلول:**
   ```bash
   bun run start
   ```

6. **براؤزر پرانیزئ:** `http://localhost:3000`

---

## 🇬🇧 English

### Prerequisites

Before installing, you need two programs:

#### 1. Install Node.js
- Go to https://nodejs.org/
- Download and install the **LTS** version
- Restart your computer after installation

#### 2. Install Bun
- **Windows**: Open PowerShell and run:
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
- **Mac/Linux**: Open terminal and run:
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

### Installation

#### Option 1: Automatic Install (Recommended)

**Windows:**
- Download the `install.bat` file
- Double-click it and follow instructions

**Mac/Linux:**
```bash
chmod +x install.sh
./install.sh
```

#### Option 2: Manual Install

```bash
# 1. Clone the project
git clone https://github.com/M-1-hashim/gas-station-management-system.git
cd gas-station-management-system

# 2. Install dependencies
bun install

# 3. Create database
bun run db:push

# 4. Build for production
bun run build

# 5. Start the system
bun run start
```

Then open: **http://localhost:3000**

### Daily Usage

After installation, to run daily:

**Windows:** Double-click `start.bat`

**Mac/Linux:** Run `./start.sh`

Then open browser: `http://localhost:3000`

### Auto-Start on Boot

```bash
npm install -g pm2
pm2 start "bun run start" --name gas-station
pm2 save
pm2 startup
```

---

## 📌 Important Notes | یادداشت‌های مهم | مهم یادښتونه

1. **Offline System**: This system works completely offline. No internet needed.
   - این سیستم بطور کامل آفلاین کار می‌کند. انترنت نیاز نیست.
   - دا سیسټم په بشپړه توګه آفلاین کار کوي.

2. **Data Storage**: All data is stored locally on your computer in SQLite.
   - تمام معلومات در کمپیوتر شما ذخیره می‌شود.
   - ټول معلومات په ستاسو کمپیوټر کې خوندي کیږي.

3. **Backup**: Use Settings → Export Backup regularly to save your data.
   - برای بکاپ، به تنظیمات → صادرات بکاپ بروید.
   - د بکاپ لپاره، تنظیمات → صادرات بکاپ ته ولاړ شئ.

4. **Port**: The system runs on port 3000. Make sure nothing else uses this port.
   - سیستم روی پورت 3000 اجرا می‌شود.
   - سیسټم په پورټ 3000 کې چلیږي.

5. **Browser**: Works best with Chrome, Firefox, or Edge.
   - بهترین با مرورگر کروم، فایرفاکس یا اج کار می‌کند.
   - غوره د کروم، فایرفاکس یا اج سره کار کوي.

---

## ❓ Troubleshooting | حل مشکلات | د ستونزو حل

### Problem: "bun: command not found"
**Solution**: Restart your terminal/computer after installing Bun.

### Problem: Port 3000 already in use
**Solution**: 
```bash
# Find and kill process using port 3000
# ویندوز:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# مک/لینکس:
lsof -ti:3000 | xargs kill -9
```

### Problem: Database errors
**Solution**: Reset the database:
```bash
bun run db:push
```

### Problem: Build fails
**Solution**: Clean install:
```bash
rm -rf node_modules .next
bun install
bun run build
```
