#!/usr/bin/env bash
# Nightly Printavo full image URL scrape runner
# Usage: ./scripts/run_full_printavo_scrape.sh
# Runs scraper in background with nohup + caffeinate to prevent sleep.

set -euo pipefail
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV_PY="$PROJECT_ROOT/.venv/bin/python"
SCRIPT="$PROJECT_ROOT/scripts/scrape_image_urls.py"
LOG_FILE="$PROJECT_ROOT/scraper.log"

if [ ! -f "$VENV_PY" ]; then
  echo "❌ Virtual environment python not found at $VENV_PY"
  echo "Run: python3 -m venv .venv && . .venv/bin/activate && pip install requests beautifulsoup4"
  exit 1
fi

if [ ! -f "$SCRIPT" ]; then
  echo "❌ Scraper script not found at $SCRIPT"; exit 1; fi

echo "🚀 Starting full Printavo scrape (resume-capable)" | tee "$LOG_FILE"
start_ts=$(date '+%Y-%m-%d %H:%M:%S')
echo "Start Time: $start_ts" | tee -a "$LOG_FILE"

# Prevent sleep while running; run in background with nohup
(
  cd "$PROJECT_ROOT" && \
  caffeinate -dims nohup "$VENV_PY" "$SCRIPT" >> "$LOG_FILE" 2>&1
) &
PID=$!

echo "✅ Scraper started in background (PID: $PID)" | tee -a "$LOG_FILE"
echo "📄 Logs: tail -f $LOG_FILE" | tee -a "$LOG_FILE"
echo "🛑 To stop: kill $PID" | tee -a "$LOG_FILE"

echo "ℹ️ Checkpoints saved every 20 orders to data/processed/orders_with_images.json" | tee -a "$LOG_FILE"
