# PrintShop OS - Python Module

This Python module provides integrations and utilities for the PrintShop OS platform.

## Components

### Label Formatter Module (`printshop_os.labels`)

The label formatter module provides automatic formatting and processing of shipping labels for thermal printers.

**Features:**
- Automatic rotation detection and correction
- Smart cropping to remove whitespace
- Standardized 4x6 inch output (Rollo printer compatible)
- Supports PDF and image formats (PNG, JPG, TIFF)
- Black & white optimization for thermal printing
- Batch processing capabilities
- REST API for integration
- Command-line interface

**Quick Start - Command Line:**

```bash
# Format a single label
python -m printshop_os.labels.cli format input.pdf output.pdf

# Batch process a directory
python -m printshop_os.labels.cli batch labels/ formatted_labels/

# Format with specific options
python -m printshop_os.labels.cli format input.pdf output.png --format png --no-rotate
```

**Quick Start - Python API:**

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

# Batch process multiple labels
formatter.batch_process(
    input_dir='downloads/',
    output_dir='ready_to_print/',
    output_format='pdf'
)
```

**Quick Start - REST API:**

```bash
# Start the API server
python -m printshop_os.labels.api

# Format a label via API
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

**Integration with Frontend:** The REST API can be integrated with the React frontend for a user-friendly web interface.

### Shipping Module (`printshop_os.shipping`)

The shipping module handles shipping integrations including label creation, tracking, and fulfillment.

#### EasyPost Integration

The EasyPost integration enables creation and management of shipping labels.

**Quick Start:**

```python
from printshop_os.shipping import EasyPostClient

# Initialize client (reads EASYPOST_API_KEY from environment)
client = EasyPostClient()

# Create a shipment
shipment = client.create_shipment(
    from_address={"name": "Sender", "street1": "123 Main St", ...},
    to_address={"name": "Recipient", "street1": "456 Oak Ave", ...},
    parcel={"length": 10, "width": 8, "height": 4, "weight": 15}
)

# Buy the label
label = client.buy_shipment(shipment['id'])
print(f"Label URL: {label['postage_label']['label_url']}")
```

**Full Documentation:** See [docs/api/easypost-integration.md](../docs/api/easypost-integration.md)

## Installation

```bash
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
EASYPOST_API_KEY=your_api_key_here
EASYPOST_MODE=test
```

## Testing

Run tests with pytest:

```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=printshop_os tests/

# Run specific test file
pytest tests/shipping/test_easypost_client.py
```

## Project Structure

```
printshop_os/
├── __init__.py
├── README.md
└── shipping/
    ├── __init__.py
    └── easypost_client.py
```

## Development

This module is part of the larger PrintShop OS ecosystem, which includes:
- Strapi (Central API & Database)
- Appsmith (Production Dashboard)
- Botpress (Customer Interface)

For more information, see the main [README.md](../README.md) in the repository root.
