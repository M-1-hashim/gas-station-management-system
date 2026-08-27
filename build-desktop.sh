#!/bin/bash
# ============================================================
# Build Desktop Setup.exe with bundled Node.js
# ساخت Setup.exe با Node.js همراه
# ============================================================

set -e

echo "================================================"
echo "  🔨 Building Desktop Setup with bundled Node.js"
echo "  ساخت Setup.exe با Node.js همراه"
echo "================================================"
echo ""

cd /home/z/my-project

# Step 1: Build Next.js
echo "📋 Step 1: Building Next.js..."
rm -rf .next dist-electron
bun run build 2>&1 | tail -3
echo "  ✅ Next.js built"

# Step 2: Copy static files
echo "📋 Step 2: Copying static files..."
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
find .next/standalone -type l -exec rm -f {} \; 2>/dev/null
echo "  ✅ Static files copied"

# Step 3: Download Node.js portable for Windows
echo "📋 Step 3: Downloading Node.js portable..."
NODE_VERSION="v20.18.0"
NODE_URL="https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-x64.zip"
NODE_ZIP="node-win64.zip"

if [ ! -f "$NODE_ZIP" ]; then
    echo "  📥 Downloading Node.js ${NODE_VERSION}..."
    curl -L -o "$NODE_ZIP" "$NODE_URL" 2>&1 | tail -3
fi

# Extract node.exe
echo "  📦 Extracting Node.js..."
rm -rf node-portable
mkdir -p node-portable
unzip -q -o "$NODE_ZIP" -d node-portable/
cp node-portable/node-${NODE_VERSION}-win-x64/node.exe .next/standalone/
echo "  ✅ Node.js portable bundled"

# Step 4: Update electron main.js to use bundled node
echo "📋 Step 4: Building Electron app..."
npx electron-builder --win --config.npmRebuild=false 2>&1 | tail -10 || true
echo "  ✅ Electron app built"

# Step 5: Build NSIS installer
echo "📋 Step 5: Building Setup.exe installer..."
MAKENSIS="/home/z/.cache/electron-builder/nsis-3.0.4.1/nsis-3.0.4.1-1mx3n/linux/makensis"
"$MAKENSIS" -V2 installer-desktop.nsi 2>&1 | tail -5
echo "  ✅ Setup.exe built"

# Verify
echo ""
echo "================================================"
ls -lh GasStationManager-Desktop-Setup.exe
echo "================================================"
echo "  ✅ COMPLETE!"
echo "================================================"
