"""
Flask API for Label Formatter Service

Provides REST endpoints for uploading and processing shipping labels.
"""

import os
import tempfile
from pathlib import Path
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from .formatter import LabelFormatter

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend integration

# Configuration
UPLOAD_FOLDER = tempfile.mkdtemp()
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'tiff'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

# Initialize formatter
formatter = LabelFormatter()


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'label-formatter',
        'version': '1.0.0'
    })


@app.route('/api/labels/format', methods=['POST'])
def format_label():
    """
    Format a shipping label for printing.
    
    Accepts:
        - file: Label file (PDF or image)
        - format: Output format (pdf or png, default: pdf)
        - auto_rotate: Auto-detect rotation (true/false, default: true)
        - optimize_bw: Optimize for B&W (true/false, default: true)
    
    Returns:
        Formatted label file ready for printing
    """
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    try:
        # Get parameters
        output_format = request.form.get('format', 'pdf').lower()
        auto_rotate = request.form.get('auto_rotate', 'true').lower() == 'true'
        optimize_bw = request.form.get('optimize_bw', 'true').lower() == 'true'
        
        if output_format not in ['pdf', 'png']:
            return jsonify({'error': 'Invalid output format. Must be pdf or png'}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        input_path = Path(app.config['UPLOAD_FOLDER']) / filename
        file.save(input_path)
        
        # Process label
        output_filename = f"formatted_{Path(filename).stem}.{output_format}"
        output_path = Path(app.config['UPLOAD_FOLDER']) / output_filename
        
        formatter.process_label(
            input_path=input_path,
            output_path=output_path,
            output_format=output_format,
            auto_rotate=auto_rotate,
            optimize_bw=optimize_bw
        )
        
        # Send processed file
        return send_file(
            output_path,
            as_attachment=True,
            download_name=output_filename,
            mimetype='application/pdf' if output_format == 'pdf' else 'image/png'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up temporary files
        try:
            if input_path.exists():
                input_path.unlink()
            if output_path.exists() and output_path != input_path:
                # Only delete if we're not in the middle of sending
                pass  # File will be cleaned up by send_file
        except:
            pass


@app.route('/api/labels/preview', methods=['POST'])
def preview_label():
    """
    Generate a preview of the formatted label (always returns PNG).
    
    Accepts:
        - file: Label file (PDF or image)
    
    Returns:
        PNG preview of formatted label
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({
            'error': f'File type not allowed. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
        }), 400
    
    try:
        # Save uploaded file
        filename = secure_filename(file.filename)
        input_path = Path(app.config['UPLOAD_FOLDER']) / filename
        file.save(input_path)
        
        # Generate preview (always PNG)
        output_filename = f"preview_{Path(filename).stem}.png"
        output_path = Path(app.config['UPLOAD_FOLDER']) / output_filename
        
        formatter.process_label(
            input_path=input_path,
            output_path=output_path,
            output_format='png',
            auto_rotate=True,
            optimize_bw=False  # Don't optimize for preview
        )
        
        # Send preview
        return send_file(
            output_path,
            mimetype='image/png'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        # Clean up
        try:
            if input_path.exists():
                input_path.unlink()
        except:
            pass


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error."""
    return jsonify({
        'error': f'File too large. Maximum size is {MAX_FILE_SIZE / (1024*1024):.0f}MB'
    }), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server errors."""
    return jsonify({
        'error': 'Internal server error',
        'message': str(e)
    }), 500


def run_server(host='0.0.0.0', port=5001, debug=False):
    """Run the Flask server."""
    print(f"🚀 Label Formatter API starting on http://{host}:{port}")
    print(f"📝 Health check: http://{host}:{port}/health")
    print(f"📋 Format endpoint: http://{host}:{port}/api/labels/format")
    print(f"👁️  Preview endpoint: http://{host}:{port}/api/labels/preview")
    app.run(host=host, port=port, debug=debug)


if __name__ == '__main__':
    run_server(debug=True)
