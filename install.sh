#!/bin/bash
# ============================================================
# Gas Station Management System - Auto Installer
# سیستم مدیریت تانک تیل - نصب خودکار
# ============================================================

set -e

echo "================================================"
echo "  ⛽ Gas Station Management System Installer"
echo "  سیستم مدیریت تانک تیل - نصب خودکار"
echo "================================================"
echo ""

# Check OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo "Detected OS: $OS"
echo ""

# Step 1: Check Node.js
echo "📋 Step 1: Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo "  ✅ Node.js found: $NODE_VERSION"
else
    echo "  ❌ Node.js not found!"
    echo "  Please install Node.js from: https://nodejs.org/"
    echo "  لطفاً Node.js را از سایت فوق نصب کنید"
    exit 1
fi

# Step 2: Check/Install Bun
echo ""
echo "📋 Step 2: Checking Bun runtime..."
if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun -v)
    echo "  ✅ Bun found: $BUN_VERSION"
else
    echo "  ⚠️  Bun not found. Installing Bun..."
    if [[ "$OS" == "windows" ]]; then
        echo "  Please install Bun manually:"
        echo "  powershell -c \"irm bun.sh/install.ps1 | iex\""
        exit 1
    else
        curl -fsSL https://bun.sh/install | bash
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
        echo "  ✅ Bun installed successfully"
    fi
fi

# Step 3: Clone or Update Repository
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$SCRIPT_DIR/gas-station-app"

echo ""
echo "📋 Step 3: Setting up application..."
if [ -d "$APP_DIR" ]; then
    echo "  📁 Existing installation found. Updating..."
    cd "$APP_DIR"
    git pull origin main 2>/dev/null || echo "  (Already up to date)"
else
    echo "  📥 Cloning repository..."
    git clone https://github.com/M-1-hashim/gas-station-management-system.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 4: Install Dependencies
echo ""
echo "📋 Step 4: Installing dependencies..."
bun install
echo "  ✅ Dependencies installed"

# Step 5: Setup Database
echo ""
echo "📋 Step 5: Setting up database..."
bun run db:push
echo "  ✅ Database created (SQLite - offline)"

# Step 6: Build for Production
echo ""
echo "📋 Step 6: Building for production..."
bun run build
echo "  ✅ Build complete"

# Step 7: Create start script
echo ""
echo "📋 Step 7: Creating start scripts..."

# Create start script
cat > "$APP_DIR/start.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Starting Gas Station Management System..."
echo "   سیستم مدیریت تانک تیل در حال شروع..."
echo ""
bun run start &
APP_PID=$!
echo ""
echo "✅ System is running!"
echo "   سیستم فعال است!"
echo ""
echo "🌐 Open your browser to: http://localhost:3000"
echo "   مرورگر خود را باز کنید: http://localhost:3000"
echo ""
echo "⏹️  Press Ctrl+C to stop the system"
echo "   برای توقف Ctrl+C را فشار دهید"
echo ""
wait $APP_PID
EOF
chmod +x "$APP_DIR/start.sh"

# Create stop script
cat > "$APP_DIR/stop.sh" << 'EOF'
#!/bin/bash
echo "⏹️  Stopping Gas Station Management System..."
pkill -f "next start" 2>/dev/null || true
pkill -f "bun run start" 2>/dev/null || true
echo "✅ System stopped"
EOF
chmod +x "$APP_DIR/stop.sh"

echo "  ✅ Start/Stop scripts created"

# Step 8: Optional PM2 setup
echo ""
echo "📋 Step 8: Auto-start setup (optional)..."
if command -v pm2 &> /dev/null; then
    pm2 start "bun run start" --name gas-station --cwd "$APP_DIR"
    pm2 save
    echo "  ✅ Auto-start configured with PM2"
    echo "  System will start automatically on boot"
else
    echo "  ℹ️  For auto-start on boot, install PM2:"
    echo "     npm install -g pm2"
    echo "     Then run: pm2 start \"bun run start\" --name gas-station"
fi

# Final message
echo ""
echo "================================================"
echo "  ✅ Installation Complete! / نصب کامل شد!"
echo "================================================"
echo ""
echo "🚀 To start the system:"
echo "   cd $APP_DIR"
echo "   ./start.sh"
echo ""
echo "🌐 Then open: http://localhost:3000"
echo ""
echo "📊 To stop the system:"
echo "   ./stop.sh"
echo ""
echo "📁 Application location: $APP_DIR"
echo ""
echo "================================================"
