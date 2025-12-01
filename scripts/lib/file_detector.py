"""
File Type Detection and Categorization

Identifies and categorizes file types for Printavo extraction.
Supports artwork, vector, documents, embroidery, and source files.
"""

import os
import re
import struct
from enum import Enum
from pathlib import Path
from typing import Optional, Tuple
from urllib.parse import urlparse, unquote


class FileType(Enum):
    """File type categories for production files."""
    ARTWORK = "artwork"           # PNG, JPG, GIF - raster images
    VECTOR = "vector"             # AI, EPS, SVG - vector graphics
    DOCUMENT = "document"         # PDF files
    EMBROIDERY = "embroidery"     # DST, PES, EXP - embroidery machine files
    SOURCE = "source"             # PSD, INDD - source design files
    UNKNOWN = "unknown"


# Extension to FileType mapping
EXTENSION_MAP = {
    # Artwork (raster)
    '.png': FileType.ARTWORK,
    '.jpg': FileType.ARTWORK,
    '.jpeg': FileType.ARTWORK,
    '.gif': FileType.ARTWORK,
    '.bmp': FileType.ARTWORK,
    '.tiff': FileType.ARTWORK,
    '.tif': FileType.ARTWORK,
    '.webp': FileType.ARTWORK,
    
    # Vector graphics
    '.ai': FileType.VECTOR,
    '.eps': FileType.VECTOR,
    '.svg': FileType.VECTOR,
    '.cdr': FileType.VECTOR,  # CorelDRAW
    
    # Documents
    '.pdf': FileType.DOCUMENT,
    
    # Embroidery files (critical for production)
    '.dst': FileType.EMBROIDERY,   # Tajima
    '.pes': FileType.EMBROIDERY,   # Brother
    '.exp': FileType.EMBROIDERY,   # Melco
    '.jef': FileType.EMBROIDERY,   # Janome
    '.vp3': FileType.EMBROIDERY,   # Husqvarna Viking
    '.hus': FileType.EMBROIDERY,   # Husqvarna
    '.xxx': FileType.EMBROIDERY,   # Singer
    '.sew': FileType.EMBROIDERY,   # Janome/Elna
    '.shv': FileType.EMBROIDERY,   # Husqvarna
    '.pcs': FileType.EMBROIDERY,   # Pfaff
    
    # Source files
    '.psd': FileType.SOURCE,       # Photoshop
    '.indd': FileType.SOURCE,      # InDesign
    '.idml': FileType.SOURCE,      # InDesign Markup
    '.ai': FileType.SOURCE,        # Also a source file
    '.afdesign': FileType.SOURCE,  # Affinity Designer
    '.afphoto': FileType.SOURCE,   # Affinity Photo
}

# MIME type to extension mapping
MIME_TO_EXT = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/tiff': '.tiff',
    'image/bmp': '.bmp',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'application/postscript': '.eps',
    'application/illustrator': '.ai',
    'application/octet-stream': '',  # Binary, need to detect
}

# Magic bytes for file type detection
MAGIC_BYTES = {
    b'\x89PNG\r\n\x1a\n': '.png',
    b'\xff\xd8\xff': '.jpg',
    b'GIF87a': '.gif',
    b'GIF89a': '.gif',
    b'%PDF': '.pdf',
    b'%!PS': '.eps',
    b'RIFF': '.webp',  # Need additional check
    b'PK\x03\x04': '.zip',  # AI files can be ZIP-based
}


class FileDetector:
    """Detects and categorizes file types."""
    
    # Priority levels for file types (higher = more important)
    PRIORITY = {
        FileType.EMBROIDERY: 5,   # Critical for production
        FileType.VECTOR: 4,       # Needed for scaling/editing
        FileType.DOCUMENT: 3,     # PDF approvals
        FileType.ARTWORK: 2,      # Preview images
        FileType.SOURCE: 3,       # Source files for editing
        FileType.UNKNOWN: 0,
    }
    
    @classmethod
    def detect_from_url(cls, url: str) -> Tuple[Optional[str], FileType]:
        """
        Detect file extension and type from URL.
        
        Args:
            url: URL to analyze
            
        Returns:
            Tuple of (extension, FileType)
        """
        if not url:
            return None, FileType.UNKNOWN
        
        # Parse URL and get path
        parsed = urlparse(url)
        path = unquote(parsed.path)
        
        # Try to get extension from path
        ext = Path(path).suffix.lower()
        
        # Handle Filestack/Filepicker CDN URLs
        # These often don't have extensions
        if 'filestackcontent.com' in url or 'filepicker.io' in url:
            # Check URL params for original filename
            if 'filename=' in url:
                match = re.search(r'filename=([^&]+)', url)
                if match:
                    fname = unquote(match.group(1))
                    ext = Path(fname).suffix.lower()
        
        if ext in EXTENSION_MAP:
            return ext, EXTENSION_MAP[ext]
        
        return ext if ext else None, FileType.UNKNOWN
    
    @classmethod
    def detect_from_content(cls, data: bytes) -> Tuple[Optional[str], FileType]:
        """
        Detect file type from file content (magic bytes).
        
        Args:
            data: First ~16 bytes of file content
            
        Returns:
            Tuple of (extension, FileType)
        """
        if not data or len(data) < 4:
            return None, FileType.UNKNOWN
        
        # Check magic bytes
        for magic, ext in MAGIC_BYTES.items():
            if data.startswith(magic):
                return ext, EXTENSION_MAP.get(ext, FileType.UNKNOWN)
        
        # Check for DST embroidery file
        # DST files start with the stitch data, checking for common patterns
        if cls._is_dst_file(data):
            return '.dst', FileType.EMBROIDERY
        
        # Check for PES embroidery file
        if data[:4] == b'#PES':
            return '.pes', FileType.EMBROIDERY
        
        # Check for EXP embroidery file (starts with 0x80)
        if len(data) > 2 and data[0] == 0x80:
            return '.exp', FileType.EMBROIDERY
        
        return None, FileType.UNKNOWN
    
    @classmethod
    def _is_dst_file(cls, data: bytes) -> bool:
        """
        Check if data looks like a DST embroidery file.
        DST files have a header with specific patterns.
        """
        if len(data) < 512:
            return False
        
        # DST header is 512 bytes with specific field markers
        # Look for LA: (label) marker
        if b'LA:' in data[:512]:
            return True
        
        # Alternative: Check for stitch commands (3-byte patterns)
        # This is a heuristic - DST uses 3-byte stitch commands
        return False
    
    @classmethod
    def detect_from_file(cls, filepath: Path) -> Tuple[Optional[str], FileType]:
        """
        Detect file type from file path and content.
        
        Args:
            filepath: Path to file
            
        Returns:
            Tuple of (extension, FileType)
        """
        if not filepath.exists():
            return None, FileType.UNKNOWN
        
        # First try extension
        ext = filepath.suffix.lower()
        if ext in EXTENSION_MAP:
            return ext, EXTENSION_MAP[ext]
        
        # Then try magic bytes
        try:
            with open(filepath, 'rb') as f:
                header = f.read(512)  # Read enough for DST header
            return cls.detect_from_content(header)
        except (OSError, IOError):
            return None, FileType.UNKNOWN
    
    @classmethod
    def detect_from_mime(cls, mime_type: str) -> Tuple[Optional[str], FileType]:
        """
        Detect file type from MIME type.
        
        Args:
            mime_type: MIME type string
            
        Returns:
            Tuple of (extension, FileType)
        """
        if not mime_type:
            return None, FileType.UNKNOWN
        
        mime_type = mime_type.lower().split(';')[0].strip()
        ext = MIME_TO_EXT.get(mime_type)
        
        if ext:
            return ext, EXTENSION_MAP.get(ext, FileType.UNKNOWN)
        
        return None, FileType.UNKNOWN
    
    @classmethod
    def get_priority(cls, file_type: FileType) -> int:
        """Get priority level for a file type."""
        return cls.PRIORITY.get(file_type, 0)
    
    @classmethod
    def categorize_extension(cls, ext: str) -> FileType:
        """
        Get FileType category for an extension.
        
        Args:
            ext: File extension (with or without leading dot)
            
        Returns:
            FileType enum value
        """
        if not ext:
            return FileType.UNKNOWN
        
        if not ext.startswith('.'):
            ext = '.' + ext
        
        return EXTENSION_MAP.get(ext.lower(), FileType.UNKNOWN)
    
    @classmethod
    def generate_filename(cls, base_name: str, url: str, index: int = 0) -> str:
        """
        Generate a safe filename from URL and base name.
        
        Args:
            base_name: Base name for the file (e.g., 'artwork', 'front_logo')
            url: Source URL
            index: Index for multiple files
            
        Returns:
            Safe filename with correct extension
        """
        ext, _ = cls.detect_from_url(url)
        
        if not ext:
            # Default to .png for images
            ext = '.png'
        
        # Sanitize base name
        safe_name = re.sub(r'[^\w\-]', '_', base_name.lower())
        safe_name = re.sub(r'_+', '_', safe_name).strip('_')
        
        if index > 0:
            return f"{safe_name}_{index}{ext}"
        return f"{safe_name}{ext}"
    
    @classmethod
    def is_production_file(cls, url_or_path: str) -> bool:
        """
        Check if a URL or path points to a production file (DST, EPS, etc.).
        
        Args:
            url_or_path: URL or file path
            
        Returns:
            True if this is a production-critical file
        """
        ext, file_type = cls.detect_from_url(url_or_path)
        
        return file_type in (FileType.EMBROIDERY, FileType.VECTOR)
    
    @classmethod
    def get_storage_path(cls, file_type: FileType) -> str:
        """
        Get the MinIO storage path prefix for a file type.
        
        Args:
            file_type: FileType enum value
            
        Returns:
            Storage path prefix
        """
        paths = {
            FileType.ARTWORK: 'artwork',
            FileType.VECTOR: 'production-files/vector',
            FileType.DOCUMENT: 'production-files/documents',
            FileType.EMBROIDERY: 'production-files/embroidery',
            FileType.SOURCE: 'production-files/source',
            FileType.UNKNOWN: 'other',
        }
        return paths.get(file_type, 'other')
    
    @classmethod
    def validate_file(cls, filepath: Path, expected_type: FileType = None) -> Tuple[bool, str]:
        """
        Validate a downloaded file for integrity.
        
        Args:
            filepath: Path to file
            expected_type: Expected file type (optional)
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not filepath.exists():
            return False, "File does not exist"
        
        file_size = filepath.stat().st_size
        if file_size == 0:
            return False, "File is empty"
        
        if file_size < 10:
            return False, "File is too small to be valid"
        
        # Check content matches expected type
        ext, detected_type = cls.detect_from_file(filepath)
        
        if expected_type and detected_type != FileType.UNKNOWN:
            if detected_type != expected_type:
                return False, f"File type mismatch: expected {expected_type.value}, got {detected_type.value}"
        
        return True, "OK"


# Convenience functions
def detect_file_type(url_or_path: str) -> FileType:
    """Quick helper to detect file type from URL or path."""
    if url_or_path.startswith('http'):
        _, file_type = FileDetector.detect_from_url(url_or_path)
    else:
        _, file_type = FileDetector.detect_from_file(Path(url_or_path))
    return file_type


def is_embroidery_file(url_or_path: str) -> bool:
    """Check if a URL/path points to an embroidery file."""
    return detect_file_type(url_or_path) == FileType.EMBROIDERY


def get_file_extension(url: str) -> str:
    """Get file extension from URL."""
    ext, _ = FileDetector.detect_from_url(url)
    return ext or '.bin'
