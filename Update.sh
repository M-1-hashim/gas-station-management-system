#!/bin/bash
# Update script for Mac/Linux
echo "================================================"
echo "  🔄 Gas Station Manager - Update"
echo "================================================"
echo ""

INSTALL_DIR="$HOME/GasStationManager"
if [ ! -d "$INSTALL_DIR" ]; then
    echo "❌ Gas Station Manager not found!"
    echo "Please install the full version first."
    exit 1
fi

echo "✅ Found installation: $INSTALL_DIR"

# Stop running instance
echo "📋 Stopping running instance..."
pkill -f "Gas Station Manager" 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
sleep 2

# Download update
echo "📥 Downloading update (88 MB)..."
UPDATE_URL="https://github.com/M-1-hashim/gas-station-management-system/releases/download/v1.0.0/update.zip"
UPDATE_ZIP="/tmp/gas-station-update.zip"

curl -L -o "$UPDATE_ZIP" "$UPDATE_URL" 2>&1 | tail -3

if [ ! -f "$UPDATE_ZIP" ]; then
    echo "❌ Failed to download update!"
    exit 1
fi

echo "✅ Download complete!"

# Backup database
APP_DIR="$INSTALL_DIR/resources/app"
echo "📋 Backing up database..."
if [ -f "$APP_DIR/db/custom.db" ]; then
    cp "$APP_DIR/db/custom.db" /tmp/gas-station-db-backup.db
    echo "✅ Database backed up"
fi

# Extract
echo "📦 Extracting update..."
unzip -o -q "$UPDATE_ZIP" -d "$APP_DIR/"
echo "✅ Update extracted!"

# Restore database
echo "📋 Restoring database..."
if [ -f /tmp/gas-station-db-backup.db ]; then
    cp /tmp/gas-station-db-backup.db "$APP_DIR/db/custom.db"
    echo "✅ Database restored"
fi

# Clean up
rm -f "$UPDATE_ZIP"

echo ""
echo "================================================"
echo "  ✅ Update Complete!"
echo "================================================"
