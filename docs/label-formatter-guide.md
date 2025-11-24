# Label Formatter Guide

**PrintShop OS - Automatic Shipping Label Formatting Tool**

## Overview

The Label Formatter is a Python-based tool that automatically formats shipping labels for thermal printer output (like Rollo printers). It eliminates the manual process of downloading, rotating, cropping, and resaving labels.

### Problem Solved

**Before (Manual Process):**
1. Download label from email
2. Open in Photoshop/image editor
3. Rotate to correct orientation
4. Crop to label size
5. Resave file
6. Print
7. Delete file

**After (Automated Process):**
1. Upload label or run command
2. Print ready-formatted label

### Key Features

- ✅ **Automatic Rotation Detection** - Detects and corrects label orientation
- ✅ **Smart Cropping** - Removes excess whitespace and borders
- ✅ **Standard Output** - Always outputs 4x6 inch labels (standard thermal size)
- ✅ **Format Support** - Works with PDF, PNG, JPG, TIFF formats
- ✅ **B&W Optimization** - Optimizes for black & white thermal printing
- ✅ **Batch Processing** - Process multiple labels at once
- ✅ **Multiple Interfaces** - CLI, Python API, and REST API

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Or install individual packages
pip install "Pillow>=10.2.0" "PyPDF2>=3.0.0" "reportlab>=4.0.0" "pdf2image>=1.16.3" "flask>=2.3.2" "flask-cors>=4.0.0"
```

### Basic Usage

#### Command Line

```bash
# Format a single label
python -m printshop_os.labels.cli format input.pdf output.pdf

# Format with specific options
python -m printshop_os.labels.cli format input.pdf output.png \
  --format png \
  --no-rotate \
  --dpi 600

# Batch process a directory
python -m printshop_os.labels.cli batch downloads/ ready_to_print/

# Batch process with pattern
python -m printshop_os.labels.cli batch labels/ formatted/ --pattern "*.pdf"
```

#### Python API

```python
from printshop_os.labels import LabelFormatter

# Initialize formatter
formatter = LabelFormatter()

# Format a single label
formatter.process_label(
    input_path='shipping_label.pdf',
    output_path='formatted_label.pdf',
    output_format='pdf',
    auto_rotate=True,
    optimize_bw=True
)

# Batch process
formatter.batch_process(
    input_dir='downloads/',
    output_dir='ready_to_print/',
    output_format='pdf'
)
```

#### REST API

```bash
# Start the server
python -m printshop_os.labels.api

# Format a label
curl -X POST http://localhost:5001/api/labels/format \
  -F "file=@label.pdf" \
  -F "format=pdf" \
  -F "auto_rotate=true" \
  --output formatted_label.pdf

# Get a preview
curl -X POST http://localhost:5001/api/labels/preview \
  -F "file=@label.pdf" \
  --output preview.png
```

## Detailed Documentation

### Label Processing Pipeline

The formatter processes labels through the following stages:

```
Input File (PDF/Image)
    ↓
1. Load & Convert to Image
    ↓
2. Auto-Rotate (Optional)
    - Detect landscape vs portrait
    - Rotate 90° if needed
    ↓
3. Crop to Label
    - Remove whitespace
    - Find label boundaries
    - Add small margin
    ↓
4. Resize to Standard
    - Fit to 4x6 inches
    - Maintain aspect ratio
    - Center on canvas
    ↓
5. Optimize B&W (Optional)
    - Increase contrast
    - Convert to pure black & white
    - Preserve barcode quality
    ↓
Output File (PDF/PNG)
```

### Configuration Options

#### LabelFormatter Class

```python
formatter = LabelFormatter(
    dpi=300  # Resolution in dots per inch
)
```

**Parameters:**
- `dpi` (int): Output resolution. Default: 300 (standard for thermal printers)

#### process_label Method

```python
formatter.process_label(
    input_path='label.pdf',      # Input file path
    output_path='output.pdf',     # Output file path
    output_format='pdf',          # 'pdf' or 'png'
    auto_rotate=True,             # Auto-detect rotation
    optimize_bw=True              # Optimize for B&W printing
)
```

**Parameters:**
- `input_path` (str/Path): Path to input file (PDF or image)
- `output_path` (str/Path): Path for output file
- `output_format` (str): Output format - 'pdf' or 'png'
- `auto_rotate` (bool): Automatically detect and correct rotation
- `optimize_bw` (bool): Optimize for black & white thermal printing

**Returns:**
- Path object pointing to the processed file

**Raises:**
- `FileNotFoundError`: If input file doesn't exist
- `ValueError`: If file format is not supported

### CLI Commands

#### format Command

Format a single label file.

```bash
python -m printshop_os.labels.cli format [OPTIONS] INPUT OUTPUT
```

**Arguments:**
- `INPUT`: Input file path (PDF or image)
- `OUTPUT`: Output file path

**Options:**
- `--format, -f {pdf,png}`: Output format (default: pdf)
- `--dpi DPI`: Output resolution in DPI (default: 300)
- `--no-rotate`: Disable automatic rotation
- `--no-optimize`: Disable B&W optimization

**Examples:**
```bash
# Basic usage
python -m printshop_os.labels.cli format label.pdf formatted.pdf

# PNG output
python -m printshop_os.labels.cli format label.pdf label.png --format png

# High resolution
python -m printshop_os.labels.cli format label.pdf label.pdf --dpi 600

# Skip auto-rotation
python -m printshop_os.labels.cli format label.pdf label.pdf --no-rotate
```

#### batch Command

Batch process multiple label files.

```bash
python -m printshop_os.labels.cli batch [OPTIONS] INPUT_DIR OUTPUT_DIR
```

**Arguments:**
- `INPUT_DIR`: Directory containing input files
- `OUTPUT_DIR`: Directory for output files

**Options:**
- `--format, -f {pdf,png}`: Output format (default: pdf)
- `--pattern, -p PATTERN`: File pattern to match (default: *)
- `--dpi DPI`: Output resolution in DPI (default: 300)

**Examples:**
```bash
# Process all files
python -m printshop_os.labels.cli batch downloads/ formatted/

# Process only PDFs
python -m printshop_os.labels.cli batch downloads/ formatted/ --pattern "*.pdf"

# Output as PNG
python -m printshop_os.labels.cli batch downloads/ formatted/ --format png
```

### REST API Endpoints

#### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "label-formatter",
  "version": "1.0.0"
}
```

#### POST /api/labels/format

Format a shipping label for printing.

**Request:**
- Method: POST
- Content-Type: multipart/form-data

**Form Data:**
- `file` (file, required): Label file (PDF or image)
- `format` (string, optional): Output format - 'pdf' or 'png' (default: 'pdf')
- `auto_rotate` (boolean, optional): Auto-detect rotation (default: true)
- `optimize_bw` (boolean, optional): Optimize for B&W (default: true)

**Response:**
- Content-Type: application/pdf or image/png
- Body: Formatted label file

**Example:**
```bash
curl -X POST http://localhost:5001/api/labels/format \
  -F "file=@label.pdf" \
  -F "format=pdf" \
  -F "auto_rotate=true" \
  -F "optimize_bw=true" \
  --output formatted_label.pdf
```

#### POST /api/labels/preview

Generate a preview of the formatted label.

**Request:**
- Method: POST
- Content-Type: multipart/form-data

**Form Data:**
- `file` (file, required): Label file (PDF or image)

**Response:**
- Content-Type: image/png
- Body: PNG preview (not optimized for B&W)

**Example:**
```bash
curl -X POST http://localhost:5001/api/labels/preview \
  -F "file=@label.pdf" \
  --output preview.png
```

### Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Success
- `400 Bad Request`: Invalid input (missing file, invalid format, etc.)
- `413 Payload Too Large`: File exceeds 10MB limit
- `500 Internal Server Error`: Processing error

**Error Response Format:**
```json
{
  "error": "Error message description"
}
```

## Integration with Frontend

### Example React Component

```tsx
import React, { useState } from 'react';

function LabelFormatter() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFormat = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', 'pdf');

    try {
      const response = await fetch('http://localhost:5001/api/labels/format', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'formatted_label.pdf';
        a.click();
      } else {
        console.error('Failed to format label');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
      <button onClick={handleFormat} disabled={!file || loading}>
        {loading ? 'Processing...' : 'Format Label'}
      </button>
    </div>
  );
}

export default LabelFormatter;
```

## Supported Carriers

The formatter works with labels from all major carriers:

- ✅ UPS
- ✅ FedEx
- ✅ USPS
- ✅ DHL
- ✅ Amazon
- ✅ Generic shipping labels

## Technical Details

### Standard Label Size

- **Dimensions:** 4 x 6 inches
- **Resolution:** 300 DPI (default)
- **Pixel Size:** 1200 x 1800 pixels at 300 DPI
- **Compatible Printers:** Rollo, Dymo, Zebra, and other 4x6 thermal printers

### Image Processing

The formatter uses the following libraries:

- **Pillow (PIL):** Image manipulation and processing
- **PyPDF2:** PDF reading and extraction
- **ReportLab:** PDF generation
- **pdf2image:** PDF to image conversion (optional, for complex PDFs)

### Performance

- **Single Label:** < 2 seconds
- **Batch Processing:** ~1-2 seconds per label
- **Memory Usage:** ~50MB per label (temporary)

## Troubleshooting

### pdf2image Not Available

If you see a warning about pdf2image, install it:

```bash
# Install pdf2image
pip install pdf2image

# On Ubuntu/Debian, also install poppler-utils
sudo apt-get install poppler-utils

# On macOS with Homebrew
brew install poppler
```

### Label Orientation Incorrect

If auto-rotation doesn't work correctly, disable it and manually specify:

```bash
python -m printshop_os.labels.cli format input.pdf output.pdf --no-rotate
```

### Poor Barcode Quality

If barcodes are not readable after optimization, disable B&W optimization:

```python
formatter.process_label(
    input_path='label.pdf',
    output_path='output.pdf',
    optimize_bw=False  # Disable optimization
)
```

## Advanced Usage

### Custom DPI

For high-resolution output:

```python
formatter = LabelFormatter(dpi=600)
formatter.process_label('input.pdf', 'output.pdf')
```

### Integration with Email

Monitor email for incoming labels:

```python
import imaplib
from email import message_from_bytes

def process_email_labels():
    # Connect to email
    mail = imaplib.IMAP4_SSL('imap.gmail.com')
    mail.login('user@example.com', 'password')
    mail.select('inbox')
    
    # Search for unread emails with attachments
    _, messages = mail.search(None, 'UNSEEN')
    
    for msg_id in messages[0].split():
        _, msg_data = mail.fetch(msg_id, '(RFC822)')
        email_body = msg_data[0][1]
        email_message = message_from_bytes(email_body)
        
        # Process attachments
        for part in email_message.walk():
            if part.get_content_maintype() == 'application':
                filename = part.get_filename()
                if filename and filename.endswith('.pdf'):
                    # Save and process label
                    # ... (implementation details)
                    pass
```

## Future Enhancements

Planned features:

- [ ] OCR-based rotation detection for more accuracy
- [ ] Barcode verification after processing
- [ ] Support for custom label sizes
- [ ] Direct printer integration
- [ ] Email monitoring service
- [ ] Web UI for drag-and-drop processing
- [ ] Mobile app support

## Support

For issues or questions:

1. Check this documentation
2. Review examples in `/examples/label_formatter_demo.py`
3. Open an issue on GitHub
4. Contact the development team

## License

This tool is part of PrintShop OS and is licensed under the MIT License.
