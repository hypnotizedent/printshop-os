#!/bin/bash
# Start Label Formatter API Service

set -e

echo "🚀 Starting PrintShop OS Label Formatter API..."
echo ""

# Change to project root
cd "$(dirname "$0")/.."

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python $python_version"
echo ""

# Check if dependencies are installed
echo "Checking dependencies..."
if ! python3 -c "import PIL, PyPDF2, reportlab" 2>/dev/null; then
    echo "⚠️  Some dependencies are missing. Installing..."
    pip install -q "Pillow>=10.2.0" "PyPDF2>=3.0.0" "reportlab>=4.0.0" "pdf2image>=1.16.3" "flask>=2.3.2" "flask-cors>=4.0.0"
    echo "✓ Dependencies installed"
else
    echo "✓ All dependencies present"
fi
echo ""

# Set PYTHONPATH
export PYTHONPATH="${PWD}:${PYTHONPATH}"

# Configuration
HOST="${LABEL_FORMATTER_HOST:-0.0.0.0}"
PORT="${LABEL_FORMATTER_PORT:-5001}"

echo "Configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT"
echo ""

# Start the server
echo "Starting Flask server..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
python3 -m printshop_os.labels.api

# Note: Server will run in foreground. Press Ctrl+C to stop.
