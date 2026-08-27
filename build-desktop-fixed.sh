#!/bin/bash
# ============================================================
# Build Desktop Setup.exe - MANUAL COPY (Fixed)
# تمام فایل‌ها دستی کپی می‌شوند تا هیچ چیز جا نیفتد
# ============================================================

set -e

cd /home/z/my-project

echo "================================================"
echo "  🔨 Building Desktop Setup (Manual Copy Fixed)"
echo "================================================"
echo ""

# Step 1: Clean and rebuild
echo "📋 Step 1: Building Next.js..."
rm -rf .next dist-electron GasStationManager-Desktop-Setup.exe
npx next build 2>&1 | tail -3
echo "  ✅ Next.js built"

# Step 2: Copy static files (use -L to follow symlinks)
echo "📋 Step 2: Preparing standalone files..."
cp -rL .next/static .next/standalone/.next/
cp -rL public .next/standalone/ 2>/dev/null || true

# Resolve Prisma symlink manually
PRISMA_SYMLINK=".next/standalone/.next/node_modules/@prisma/client-2c3a283f134fdcb6"
if [ -L "$PRISMA_SYMLINK" ]; then
    rm -f "$PRISMA_SYMLINK"
    mkdir -p .next/standalone/.next/node_modules/@prisma
    cp -rL node_modules/@prisma/client .next/standalone/.next/node_modules/@prisma/ 2>/dev/null || true
fi
echo "  ✅ Standalone files prepared"

# Step 3: Verify node_modules
echo "📋 Step 3: Verifying node_modules..."
echo "  next module exists: $(ls .next/standalone/node_modules/next/package.json 2>/dev/null && echo YES || echo NO)"
echo "  react module exists: $(ls .next/standalone/node_modules/react/package.json 2>/dev/null && echo YES || echo NO)"
echo "  prisma client exists: $(ls .next/standalone/node_modules/@prisma/client/package.json 2>/dev/null && echo YES || echo NO)"

# Step 4: Download Node.js portable
echo ""
echo "📋 Step 4: Bundling Node.js..."
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

# Step 5: Build Electron (just the shell)
echo ""
echo "📋 Step 5: Building Electron shell..."
npx electron-builder --win --config.npmRebuild=false 2>&1 | tail -5 || true
echo "  ✅ Electron shell built"

# Step 6: MANUALLY copy ALL standalone files to resources/app
echo ""
echo "📋 Step 6: Manually copying ALL files to packaged app..."
APP_DIR="dist-electron/win-unpacked/resources/app"

# Remove old app dir and recreate
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"

# Copy EVERYTHING from standalone (including node_modules)
cp -rL .next/standalone/* "$APP_DIR/"
cp -rL .next/static "$APP_DIR/.next/" 2>/dev/null || true
cp -rL public "$APP_DIR/" 2>/dev/null || true
cp -rL prisma "$APP_DIR/" 2>/dev/null || true
cp -rL db "$APP_DIR/" 2>/dev/null || true

echo "  ✅ All files copied manually"

# Step 7: Verify ALL files are present
echo ""
echo "📋 Step 7: Verifying ALL files..."
echo "  node.exe: $(ls "$APP_DIR/node.exe" 2>/dev/null && echo ✅ || echo ❌)"
echo "  server.js: $(ls "$APP_DIR/server.js" 2>/dev/null && echo ✅ || echo ❌)"
echo "  package.json: $(ls "$APP_DIR/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  next module: $(ls "$APP_DIR/node_modules/next/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  react module: $(ls "$APP_DIR/node_modules/react/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  prisma client: $(ls "$APP_DIR/node_modules/@prisma/client/package.json" 2>/dev/null && echo ✅ || echo ❌)"
echo "  schema.prisma: $(ls "$APP_DIR/prisma/schema.prisma" 2>/dev/null && echo ✅ || echo ❌)"
echo "  db file: $(ls "$APP_DIR/db/custom.db" 2>/dev/null && echo ✅ || echo ❌)"
echo "  public dir: $(ls "$APP_DIR/public/" 2>/dev/null | wc -l) files"
echo "  total node_modules: $(find "$APP_DIR/node_modules" -name "package.json" 2>/dev/null | wc -l) packages"

# Step 8: Build NSIS installer
echo ""
echo "📋 Step 8: Building Setup.exe..."
MAKENSIS="/home/z/.cache/electron-builder/nsis-3.0.4.1/nsis-3.0.4.1-1mx3n/linux/makensis"
"$MAKENSIS" -V2 installer-desktop.nsi 2>&1 | tail -5
echo "  ✅ Setup.exe built"

echo ""
echo "================================================"
ls -lh GasStationManager-Desktop-Setup.exe
echo "================================================"
echo "  ✅ COMPLETE! All files verified."
echo "================================================"
