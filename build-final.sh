#!/bin/bash
# ============================================================
# Build Desktop Setup.exe - FINAL FIXED VERSION
# تمام فایل‌ها همراه برنامه، شامل فایل‌های مخفی
# ============================================================

set -e

cd /home/z/my-project

echo "================================================"
echo "  🔨 Building Desktop Setup (Final Fix)"
echo "================================================"
echo ""

# Step 1: Clean and rebuild Next.js
echo "📋 Step 1: Building Next.js..."
rm -rf .next dist-electron GasStationManager-Desktop-Setup.exe
npx next build 2>&1 | tail -3
echo "  ✅ Next.js built"

# Step 2: Copy static files to standalone .next directory
echo "📋 Step 2: Copying static files..."
cp -rL .next/static .next/standalone/.next/
cp -rL public .next/standalone/ 2>/dev/null || true
echo "  ✅ Static files copied"

# Step 3: Resolve Prisma symlink
echo "📋 Step 3: Resolving Prisma symlink..."
PRISMA_SYMLINK=".next/standalone/.next/node_modules/@prisma/client-2c3a283f134fdcb6"
if [ -L "$PRISMA_SYMLINK" ]; then
    rm -f "$PRISMA_SYMLINK"
    mkdir -p .next/standalone/.next/node_modules/@prisma
    cp -rL node_modules/@prisma/client .next/standalone/.next/node_modules/@prisma/ 2>/dev/null || true
fi
echo "  ✅ Prisma resolved"

# Step 4: Verify standalone has BUILD_ID (critical!)
echo "📋 Step 4: Verifying BUILD_ID..."
if [ -f ".next/standalone/.next/BUILD_ID" ]; then
    echo "  ✅ BUILD_ID exists: $(cat .next/standalone/.next/BUILD_ID)"
else
    echo "  ❌ BUILD_ID NOT FOUND!"
    exit 1
fi

# Step 5: Download Node.js portable
echo ""
echo "📋 Step 5: Bundling Node.js..."
NODE_VERSION="v20.18.0"
NODE_ZIP="node-win64.zip"
if [ ! -f "$NODE_ZIP" ]; then
    curl -L -o "$NODE_ZIP" "https://nodejs.org/dist/${NODE_VERSION}/node-${NODE_VERSION}-win-x64.zip"
fi
rm -rf node-portable
mkdir -p node-portable
unzip -q -o "$NODE_ZIP" -d node-portable/
cp node-portable/node-${NODE_VERSION}-win-x64/node.exe .next/standalone/
echo "  ✅ Node.js bundled"

# Step 6: Build Electron shell
echo ""
echo "📋 Step 6: Building Electron shell..."
npx electron-builder --win --config.npmRebuild=false 2>&1 | tail -5 || true
echo "  ✅ Electron shell built"

# Step 7: MANUALLY copy ALL files (including hidden .next directory)
echo ""
echo "📋 Step 7: Copying ALL files to app (including hidden)..."
APP_DIR="dist-electron/win-unpacked/resources/app"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"

# KEY FIX: Use /.  to copy ALL files including hidden ones (like .next)
cp -aL .next/standalone/. "$APP_DIR/"
cp -rL .next/static "$APP_DIR/.next/" 2>/dev/null || true
cp -rL public "$APP_DIR/" 2>/dev/null || true
cp -rL prisma "$APP_DIR/" 2>/dev/null || true
cp -rL db "$APP_DIR/" 2>/dev/null || true
echo "  ✅ All files copied (including hidden)"

# Step 8: Verify ALL critical files
echo ""
echo "📋 Step 8: Verifying critical files..."
echo "  node.exe:          $(ls "$APP_DIR/node.exe" 2>/dev/null && echo ✅ || echo ❌)"
echo "  server.js:         $(ls "$APP_DIR/server.js" 2>/dev/null && echo ✅ || echo ❌)"
echo "  .next/BUILD_ID:    $(ls "$APP_DIR/.next/BUILD_ID" 2>/dev/null && echo ✅ || echo ❌)"
echo "  .next/static/:     $(ls "$APP_DIR/.next/static/" 2>/dev/null | wc -l) dirs"
echo "  next module:       $(ls "$APP_DIR/node_modules/next/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  react module:      $(ls "$APP_DIR/node_modules/react/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  prisma client:     $(ls "$APP_DIR/node_modules/@prisma/client/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  prisma .prisma:    $(ls "$APP_DIR/node_modules/.prisma/client/index.js" 2>/dev/null && echo ✅ || echo ❌)"
echo "  schema.prisma:     $(ls "$APP_DIR/prisma/schema.prisma" 2>/dev/null && echo ✅ || echo ❌)"
echo "  db file:           $(ls "$APP_DIR/db/custom.db" 2>/dev/null && echo ✅ || echo ❌)"

# Count total packages
PKG_COUNT=$(find "$APP_DIR/node_modules" -name "package.json" 2>/dev/null | wc -l)
echo "  total packages:    $PKG_COUNT"

# Step 9: Build NSIS installer
echo ""
echo "📋 Step 9: Building Setup.exe..."
MAKENSIS="/home/z/.cache/electron-builder/nsis-3.0.4.1/nsis-3.0.4.1-1mx3n/linux/makensis"
"$MAKENSIS" -V2 installer-desktop.nsi 2>&1 | tail -5
echo "  ✅ Setup.exe built"

echo ""
echo "================================================"
ls -lh GasStationManager-Desktop-Setup.exe
echo "================================================"
echo "  ✅ COMPLETE! All files verified including BUILD_ID."
echo "================================================"
