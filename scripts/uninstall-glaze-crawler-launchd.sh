#!/bin/bash

PLIST_DEST="$HOME/Library/LaunchAgents/com.clayroute.glazecrawler.plist"

echo "Uninstalling glaze crawler launchd agent..."

# Unload the agent
launchctl unload "$PLIST_DEST" 2>/dev/null

# Remove plist
rm -f "$PLIST_DEST"

if [ $? -eq 0 ]; then
  echo "✓ Glaze crawler uninstalled"
else
  echo "Note: Crawler may have already been unloaded"
fi
