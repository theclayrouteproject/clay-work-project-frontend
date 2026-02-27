#!/bin/bash

# Uninstall the Glazy crawler launchd job

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.clayroute.glazecrawler.plist"

if [ -f "$PLIST_FILE" ]; then
  launchctl unload "$PLIST_FILE" 2>/dev/null
  rm "$PLIST_FILE"
  echo "✓ Glazy crawler stopped and uninstalled"
else
  echo "Glazy crawler not installed"
fi
