#!/bin/bash

PLIST_SOURCE="/Users/stevengerlich/clay-work-project/scripts/com.clayroute.glazecrawler.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.clayroute.glazecrawler.plist"
LOG_DIR="/Users/stevengerlich/clay-work-project/logs"

# Create logs directory
mkdir -p "$LOG_DIR"

# Copy plist
echo "Installing glaze crawler launchd agent..."
cp "$PLIST_SOURCE" "$PLIST_DEST"
chmod 644 "$PLIST_DEST"

# Load the agent
launchctl load "$PLIST_DEST"

if [ $? -eq 0 ]; then
  echo "✓ Glaze crawler installed and started"
  echo "  Will run every 10 minutes"
  echo "  Logs: $LOG_DIR/glaze-crawler.log"
  echo "  Target: 5000+ recipes by morning"
else
  echo "✗ Failed to load launchd agent"
  exit 1
fi
