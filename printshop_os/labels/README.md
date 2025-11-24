# Label Formatter Service

Automatic shipping label formatting tool for PrintShop OS.

## Quick Start

### Option 1: Command Line (Fastest)

```bash
# Install dependencies
pip install "Pillow>=10.2.0" "PyPDF2>=3.0.0" "reportlab>=4.0.0" "pdf2image>=1.16.3" "flask>=2.3.2" "flask-cors>=4.0.0"

# Format a label
python -m printshop_os.labels.cli format input.pdf output.pdf

# Batch process
python -m printshop_os.labels.cli batch downloads/ formatted/
```

### Option 2: REST API

```bash
# Start the server
./scripts/start_label_formatter.sh

# Or manually:
export PYTHONPATH=/path/to/printshop-os
python -m printshop_os.labels.api

# Format a label via API
curl -X POST http://localhost:5001/api/labels/format \
  -F "file=@label.pdf" \
  --output formatted.pdf
```

### Option 3: Docker

```bash
# Build and run
docker-compose -f docker-compose.label-formatter.yml up -d

# Check health
curl http://localhost:5001/health

# Format a label
curl -X POST http://localhost:5001/api/labels/format \
  -F "file=@label.pdf" \
  --output formatted.pdf
```

### Option 4: Python API

```python
from printshop_os.labels import LabelFormatter

formatter = LabelFormatter()
formatter.process_label('input.pdf', 'output.pdf')
```

## Features

- ✅ Automatic rotation detection
- ✅ Smart cropping
- ✅ Standard 4x6 inch output
- ✅ PDF and image support
- ✅ B&W optimization
- ✅ Batch processing
- ✅ REST API
- ✅ CLI tool

## Supported Formats

**Input:**
- PDF
- PNG
- JPG/JPEG
- TIFF

**Output:**
- PDF (recommended for printing)
- PNG (for preview)

## Configuration

### Environment Variables

- `LABEL_FORMATTER_HOST`: Server host (default: 0.0.0.0)
- `LABEL_FORMATTER_PORT`: Server port (default: 5001)
- `FLASK_ENV`: Environment (development/production)

### Label Settings

Modify these in `formatter.py`:

```python
LABEL_WIDTH_INCHES = 4   # Width in inches
LABEL_HEIGHT_INCHES = 6  # Height in inches
DPI = 300                # Resolution
```

## API Endpoints

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "label-formatter",
  "version": "1.0.0"
}
```

### `POST /api/labels/format`
Format a shipping label.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: Label file (required)
  - `format`: Output format - 'pdf' or 'png' (optional, default: 'pdf')
  - `auto_rotate`: Auto-rotate (optional, default: 'true')
  - `optimize_bw`: B&W optimization (optional, default: 'true')

**Response:**
- Formatted label file

**Example:**
```bash
curl -X POST http://localhost:5001/api/labels/format \
  -F "file=@label.pdf" \
  -F "format=pdf" \
  --output formatted.pdf
```

### `POST /api/labels/preview`
Generate a preview of the formatted label.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: Label file (required)

**Response:**
- PNG preview image

**Example:**
```bash
curl -X POST http://localhost:5001/api/labels/preview \
  -F "file=@label.pdf" \
  --output preview.png
```

## CLI Usage

### Format Command

```bash
python -m printshop_os.labels.cli format [OPTIONS] INPUT OUTPUT

Options:
  --format, -f {pdf,png}  Output format (default: pdf)
  --dpi DPI               Resolution (default: 300)
  --no-rotate             Disable auto-rotation
  --no-optimize           Disable B&W optimization
```

**Examples:**
```bash
# Basic
python -m printshop_os.labels.cli format label.pdf formatted.pdf

# PNG output
python -m printshop_os.labels.cli format label.pdf label.png --format png

# High resolution
python -m printshop_os.labels.cli format label.pdf label.pdf --dpi 600
```

### Batch Command

```bash
python -m printshop_os.labels.cli batch [OPTIONS] INPUT_DIR OUTPUT_DIR

Options:
  --format, -f {pdf,png}  Output format (default: pdf)
  --pattern, -p PATTERN   File pattern (default: *)
  --dpi DPI               Resolution (default: 300)
```

**Examples:**
```bash
# Process all files
python -m printshop_os.labels.cli batch downloads/ formatted/

# Process only PDFs
python -m printshop_os.labels.cli batch downloads/ formatted/ --pattern "*.pdf"

# PNG output
python -m printshop_os.labels.cli batch downloads/ formatted/ --format png
```

## Testing

```bash
# Run tests
pytest tests/labels/

# Run with coverage
pytest --cov=printshop_os.labels tests/labels/

# Run demo
python examples/label_formatter_demo.py
```

## Troubleshooting

### pdf2image Not Found

Install poppler-utils:

```bash
# Ubuntu/Debian
sudo apt-get install poppler-utils

# macOS
brew install poppler

# Python package
pip install pdf2image
```

### Import Error

Set PYTHONPATH:

```bash
export PYTHONPATH=/path/to/printshop-os:$PYTHONPATH
```

### Permission Denied

Make scripts executable:

```bash
chmod +x scripts/start_label_formatter.sh
```

## Development

### Project Structure

```
printshop_os/labels/
├── __init__.py         # Package initialization
├── formatter.py        # Core label processing
├── api.py             # Flask REST API
├── cli.py             # Command-line interface
├── Dockerfile         # Docker configuration
└── README.md          # This file
```

### Running in Development

```bash
# Install dependencies
pip install -r requirements.txt

# Set PYTHONPATH
export PYTHONPATH=$PWD

# Run server in debug mode
python -m printshop_os.labels.api
```

## Integration

### Frontend Integration

```tsx
import LabelFormatter from '@/components/tools/LabelFormatter';

function App() {
  return <LabelFormatter apiUrl="http://localhost:5001" />;
}
```

### Email Integration

Monitor email for incoming labels and auto-process:

```python
from printshop_os.labels import LabelFormatter

formatter = LabelFormatter()

# Watch for email attachments
for attachment in monitor_email_attachments():
    if attachment.filename.endswith('.pdf'):
        formatter.process_label(
            attachment.path,
            f'formatted/{attachment.filename}'
        )
```

## Performance

- Single label: < 2 seconds
- Batch processing: ~1-2 seconds per label
- Memory usage: ~50MB per label
- Concurrent requests: Supported (Flask)

## Support

- Documentation: `/docs/label-formatter-guide.md`
- Examples: `/examples/label_formatter_demo.py`
- Tests: `/tests/labels/`
- Issues: GitHub Issues

## License

MIT License - Part of PrintShop OS
