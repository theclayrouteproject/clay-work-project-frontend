#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LABEL="com.clayroute.dbworker"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$ROOT_DIR/var"
OUT_LOG="$LOG_DIR/db-worker.out.log"
ERR_LOG="$LOG_DIR/db-worker.err.log"
NODE_BIN="$(command -v node)"

mkdir -p "$HOME/Library/LaunchAgents"
mkdir -p "$LOG_DIR"
mkdir -p "$ROOT_DIR/app/ceramics101/database/incoming/processed"

cat > "$PLIST_PATH" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$LABEL</string>

  <key>ProgramArguments</key>
  <array>
    <string>$NODE_BIN</string>
    <string>$ROOT_DIR/scripts/db-ingest.mjs</string>
    <string>--watch</string>
  </array>

  <key>WorkingDirectory</key>
  <string>$ROOT_DIR</string>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>$OUT_LOG</string>

  <key>StandardErrorPath</key>
  <string>$ERR_LOG</string>

  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
</dict>
</plist>
PLIST

launchctl unload "$PLIST_PATH" >/dev/null 2>&1 || true
launchctl load "$PLIST_PATH"

echo "Installed and started $LABEL"
echo "plist: $PLIST_PATH"
echo "logs: $OUT_LOG / $ERR_LOG"
