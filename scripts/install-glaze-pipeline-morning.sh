#!/bin/bash

# Install a launchd job to run glaze ingestion pipeline at 7 AM daily

PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.clayroute.glazepipeline-morning.plist"

mkdir -p "$PLIST_DIR"

cat > "$PLIST_FILE" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.clayroute.glazepipeline-morning</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>cd /Users/stevengerlich/clay-work-project && npm run glaze:seed:run >> logs/glaze-pipeline-morning.log 2>&amp;1</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>7</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
</dict>
</plist>
EOF

chmod 644 "$PLIST_FILE"
launchctl load "$PLIST_FILE" 2>/dev/null || launchctl load -w "$PLIST_FILE"

echo "✓ Morning glaze pipeline scheduled for 7:00 AM daily"
echo "  Log: /Users/stevengerlich/clay-work-project/logs/glaze-pipeline-morning.log"
