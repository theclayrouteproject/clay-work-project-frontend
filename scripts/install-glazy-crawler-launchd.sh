#!/bin/bash

# Install the Glazy crawler launchd job

PROJECT_DIR="$HOME/clay-work-project"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.clayroute.glazecrawler.plist"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

cat > "$PLIST_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.clayroute.glazecrawler</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd /Users/stevengerlich/clay-work-project && /usr/local/bin/node scripts/glazy-crawl.mjs >> logs/glazy-crawl.log 2>&amp;1</string>
  </array>
  <key>StartInterval</key>
  <integer>600</integer>
  <key>StandardOutPath</key>
  <string>/Users/stevengerlich/clay-work-project/logs/glazy-crawl.log</string>
  <key>StandardErrorPath</key>
  <string>/Users/stevengerlich/clay-work-project/logs/glazy-crawl.log</string>
</dict>
</plist>
EOF

chmod 644 "$PLIST_FILE"

launchctl load "$PLIST_FILE" 2>/dev/null || launchctl load -w "$PLIST_FILE"

echo "✓ Glazy crawler installed and started (runs every 10 minutes)"
echo "  Log: $PROJECT_DIR/logs/glazy-crawl.log"
echo "  To check status: launchctl list | grep glazecrawler"
echo "  To stop: launchctl unload $PLIST_FILE"
