# Label Formatter Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Label Formatter System                        │
└─────────────────────────────────────────────────────────────────┘

                    ┌───────────────────┐
                    │   Input Sources   │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │   • Email         │
                    │   • Web Upload    │
                    │   • CLI           │
                    │   • File System   │
                    └─────────┬─────────┘
                              │
              ┌───────────────▼───────────────┐
              │   Label Formatter Interfaces  │
              └───────────────┬───────────────┘
                              │
      ┌───────────────────────┼───────────────────────┐
      │                       │                       │
┌─────▼──────┐         ┌──────▼──────┐        ┌──────▼──────┐
│  CLI Tool  │         │  REST API   │        │  Python API │
│            │         │  (Flask)    │        │             │
│  • format  │         │             │        │  • Direct   │
│  • batch   │         │  • /format  │        │    Import   │
└─────┬──────┘         │  • /preview │        └──────┬──────┘
      │                └──────┬──────┘               │
      │                       │                      │
      └───────────────────────┼──────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Core Formatter  │
                    │  (formatter.py)   │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │    Processing Pipeline        │
              └───────────────┬───────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼──────┐     ┌──────▼──────┐    ┌──────▼──────┐
    │  1. Load   │     │  2. Rotate  │    │  3. Crop    │
    │   & Parse  │────▶│   Detect    │───▶│  Whitespace │
    └────────────┘     └─────────────┘    └──────┬──────┘
                                                  │
                              ┌───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
    ┌─────▼──────┐     ┌──────▼──────┐    ┌──────▼──────┐
    │  4. Resize │     │  5. Optimize│    │  6. Save    │
    │  to 4x6"   │────▶│    B&W      │───▶│   Output    │
    └────────────┘     └─────────────┘    └──────┬──────┘
                                                  │
                    ┌─────────────────────────────┘
                    │
            ┌───────▼────────┐
            │  Output Format │
            └───────┬────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
   ┌────▼────┐            ┌─────▼─────┐
   │   PDF   │            │    PNG    │
   │ 4x6"    │            │  4x6"     │
   │ 300 DPI │            │  300 DPI  │
   └────┬────┘            └─────┬─────┘
        │                       │
        └───────────┬───────────┘
                    │
            ┌───────▼────────┐
            │ Thermal Printer│
            │  (e.g., Rollo) │
            └────────────────┘
```

## Processing Flow

### Before (Manual Process)

```
Email/Download → Photoshop → Rotate → Crop → Save → Print → Delete
    (1 min)        (1 min)    (30s)   (30s)  (15s)  (30s)   (15s)

Total Time: ~2-3 minutes per label
```

### After (Automated Process)

```
Upload/CLI → Label Formatter → Download → Print
   (5s)           (2s)           (2s)     (30s)

Total Time: ~5 seconds processing + 30s printing
```

## Component Architecture

### 1. Core Formatter (formatter.py)

```python
class LabelFormatter:
    ├── __init__(dpi=300)
    ├── process_label()
    │   ├── _load_image()
    │   ├── _auto_rotate()
    │   ├── _crop_to_label()
    │   ├── _resize_to_standard()
    │   ├── _optimize_bw()
    │   └── _save_as_pdf() / _save_as_image()
    └── batch_process()
```

**Key Methods:**
- `_load_image()`: Supports PDF, PNG, JPG, TIFF
- `_auto_rotate()`: Detects landscape/portrait orientation
- `_crop_to_label()`: Removes whitespace using edge detection
- `_resize_to_standard()`: Fits to 4x6" maintaining aspect ratio
- `_optimize_bw()`: Converts to high-contrast B&W for thermal printing

### 2. REST API (api.py)

```python
Flask Application:
├── GET /health
│   └── Health check endpoint
├── POST /api/labels/format
│   ├── Upload file
│   ├── Process label
│   └── Return formatted file
└── POST /api/labels/preview
    ├── Upload file
    ├── Process label
    └── Return PNG preview
```

**Features:**
- CORS enabled for frontend integration
- 10MB file size limit
- Secure filename handling
- Automatic cleanup of temporary files

### 3. CLI Tool (cli.py)

```bash
python -m printshop_os.labels.cli
├── format [OPTIONS] INPUT OUTPUT
│   ├── --format {pdf|png}
│   ├── --dpi DPI
│   ├── --no-rotate
│   └── --no-optimize
└── batch [OPTIONS] INPUT_DIR OUTPUT_DIR
    ├── --format {pdf|png}
    ├── --pattern PATTERN
    └── --dpi DPI
```

### 4. Frontend Component (LabelFormatter.tsx)

```tsx
React Component:
├── File Upload
│   ├── Drag & Drop
│   └── Click to Browse
├── Preview
│   └── PNG preview generation
├── Options
│   └── Output format selection
└── Actions
    ├── Format & Download
    └── Generate Preview
```

**User Flow:**
1. User drags/selects label file
2. (Optional) Generate preview
3. Click "Format & Download"
4. Browser downloads formatted label
5. Print directly to thermal printer

## Technology Stack

### Backend (Python)
- **Pillow (PIL)**: Image manipulation and processing
- **PyPDF2**: PDF reading and parsing
- **ReportLab**: PDF generation with precise dimensions
- **pdf2image**: Complex PDF rendering (optional)
- **Flask**: REST API server
- **Flask-CORS**: Cross-origin resource sharing

### Frontend (React/TypeScript)
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Lucide React**: Icons
- **Fetch API**: HTTP requests

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Orchestration
- **Shell Scripts**: Quick deployment

## Data Flow

### Upload Flow

```
┌─────────┐
│  Client │
└────┬────┘
     │ POST /api/labels/format
     │ multipart/form-data
     ▼
┌─────────────────┐
│   Flask API     │
│                 │
│ 1. Validate     │
│ 2. Save temp    │
│ 3. Process      │
│ 4. Send file    │
│ 5. Cleanup      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  LabelFormatter │
│                 │
│ • Load image    │
│ • Auto-rotate   │
│ • Crop          │
│ • Resize        │
│ • Optimize B&W  │
│ • Save output   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Formatted File │
│  (PDF/PNG)      │
└─────────────────┘
```

## Performance Characteristics

### Processing Time
- **Single Label**: 1-2 seconds
- **Batch (10 labels)**: 10-20 seconds
- **API Response**: < 3 seconds total

### Resource Usage
- **CPU**: Moderate (image processing)
- **Memory**: ~50MB per label (temporary)
- **Disk**: ~5MB per label (temporary)
- **Network**: Upload + download sizes

### Scalability
- **Concurrent Requests**: Supported (Flask threading)
- **File Size Limit**: 10MB (configurable)
- **Throughput**: ~20-30 labels/minute (single instance)

## Security Features

1. **File Validation**
   - Allowed extensions only (PDF, PNG, JPG, TIFF)
   - Secure filename handling
   - Size limits

2. **API Security**
   - CORS configuration
   - No debug mode in production
   - Secure file cleanup

3. **Dependencies**
   - Pillow 10.2.0+ (patched CVE)
   - Flask 2.3.2+ (session cookie fix)
   - Regular dependency updates

## Deployment Options

### Option 1: Standalone Python
```bash
pip install -r requirements.txt
python -m printshop_os.labels.api
```

### Option 2: Docker
```bash
docker-compose -f docker-compose.label-formatter.yml up
```

### Option 3: Integrated Service
```bash
# Add to main docker-compose.yml
services:
  label-formatter:
    build: printshop_os/labels/
    ports: ["5001:5001"]
```

## Integration Points

### 1. Email Integration
- Monitor IMAP/POP3 for label attachments
- Auto-download and process
- Save to shared directory

### 2. Frontend Integration
- React component in tools section
- Direct API calls from browser
- Real-time preview

### 3. Workflow Integration
- Hook into order processing
- Auto-format shipping labels
- Trigger printing via print server

### 4. Batch Processing
- Watch folder for new labels
- Process automatically
- Move to "ready to print" folder

## Future Enhancements

1. **Advanced Features**
   - OCR-based rotation detection
   - Barcode verification
   - Multi-label sheets
   - Custom label sizes

2. **Integration**
   - Direct printer integration
   - Cloud storage sync
   - Webhook notifications
   - Email auto-processing

3. **Performance**
   - GPU acceleration
   - Parallel processing
   - Caching layer
   - Queue system

4. **UI/UX**
   - Batch upload in UI
   - Drag-to-reorder
   - Print preview
   - Label templates

## Troubleshooting

### Common Issues

1. **"pdf2image not found"**
   - Install: `pip install pdf2image`
   - System dep: `apt-get install poppler-utils`

2. **"Module not found"**
   - Set PYTHONPATH: `export PYTHONPATH=/path/to/printshop-os`

3. **"Permission denied"**
   - Make scripts executable: `chmod +x scripts/*.sh`

4. **"Poor barcode quality"**
   - Disable optimization: `optimize_bw=False`

5. **"Wrong orientation"**
   - Disable auto-rotate: `auto_rotate=False`

## Monitoring & Logging

### Health Checks
```bash
curl http://localhost:5001/health
# {"status": "healthy", "service": "label-formatter", "version": "1.0.0"}
```

### Logs
- Console output (development)
- File logging (production)
- Error tracking (future: Sentry)

### Metrics
- Processing time per label
- Success/failure rate
- File size distribution
- API response times

---

**Last Updated**: November 24, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
