#!/bin/bash

# Continuous crawler for overnight operation
# Runs multiple crawl sessions in parallel

PROJECT_DIR="/Users/stevengerlich/clay-work-project"
cd "$PROJECT_DIR"

echo "[continuous-crawl] Starting overnight crawl sessions..."
echo "[continuous-crawl] Running 4 parallel crawlers, each every 5 minutes"
echo "[continuous-crawl] Target: Maximize recipes collected by morning"

# Function to run crawler in loop
crawl_loop() {
  local id=$1
  while true; do
    echo "[continuous-crawl-$id] $(date '+%H:%M:%S') Starting crawl..."
    node scripts/glazy-crawl.mjs >> logs/glaze-crawl-continuous.log 2>&1
    sleep 300  # 5 minutes between sessions
  done
}

# Start 4 parallel crawlers with staggered starts
(crawl_loop 1) &
sleep 75
(crawl_loop 2) &
sleep 75
(crawl_loop 3) &
sleep 75
(crawl_loop 4) &

echo "[continuous-crawl] $(date '+%H:%M:%S') 4 crawlers started in background"
echo "[continuous-crawl] Monitor logs: tail -f logs/glaze-crawl-continuous.log"

# Wait for all background processes
wait
