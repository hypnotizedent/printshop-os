"""
Unit tests for FileDetector module.
"""

import pytest
from pathlib import Path
import tempfile
import sys
import os

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'scripts'))

from lib.file_detector import FileDetector, FileType, detect_file_type, is_embroidery_file


class TestFileDetector:
    """Test suite for FileDetector."""
    
    def test_detect_from_url_png(self):
        """Test detecting PNG from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/image.png")
        assert ext == ".png"
        assert file_type == FileType.ARTWORK
    
    def test_detect_from_url_jpg(self):
        """Test detecting JPG from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/image.jpg")
        assert ext == ".jpg"
        assert file_type == FileType.ARTWORK
    
    def test_detect_from_url_dst(self):
        """Test detecting DST embroidery file from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/logo.dst")
        assert ext == ".dst"
        assert file_type == FileType.EMBROIDERY
    
    def test_detect_from_url_eps(self):
        """Test detecting EPS from URL."""
        ext, file_type = FileDetector.detect_from_url("https://cdn.filepicker.io/abc123/design.eps")
        assert ext == ".eps"
        assert file_type == FileType.VECTOR
    
    def test_detect_from_url_pdf(self):
        """Test detecting PDF from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/proof.pdf")
        assert ext == ".pdf"
        assert file_type == FileType.DOCUMENT
    
    def test_detect_from_url_psd(self):
        """Test detecting PSD from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/source.psd")
        assert ext == ".psd"
        assert file_type == FileType.SOURCE
    
    def test_detect_from_url_unknown(self):
        """Test unknown file type from URL."""
        ext, file_type = FileDetector.detect_from_url("https://example.com/file.xyz")
        assert file_type == FileType.UNKNOWN
    
    def test_detect_from_url_empty(self):
        """Test empty URL."""
        ext, file_type = FileDetector.detect_from_url("")
        assert ext is None
        assert file_type == FileType.UNKNOWN
    
    def test_detect_from_url_filestack(self):
        """Test Filestack CDN URL without extension."""
        ext, file_type = FileDetector.detect_from_url(
            "https://filestackcontent.com/abc123?filename=logo.png"
        )
        assert ext == ".png"
        assert file_type == FileType.ARTWORK
    
    def test_categorize_extension_with_dot(self):
        """Test categorizing extension with leading dot."""
        assert FileDetector.categorize_extension(".dst") == FileType.EMBROIDERY
    
    def test_categorize_extension_without_dot(self):
        """Test categorizing extension without leading dot."""
        assert FileDetector.categorize_extension("dst") == FileType.EMBROIDERY
    
    def test_categorize_extension_uppercase(self):
        """Test categorizing uppercase extension."""
        assert FileDetector.categorize_extension(".DST") == FileType.EMBROIDERY
        assert FileDetector.categorize_extension(".PNG") == FileType.ARTWORK
    
    def test_get_priority(self):
        """Test file type priority levels."""
        assert FileDetector.get_priority(FileType.EMBROIDERY) == 5
        assert FileDetector.get_priority(FileType.VECTOR) == 4
        assert FileDetector.get_priority(FileType.ARTWORK) == 2
        assert FileDetector.get_priority(FileType.UNKNOWN) == 0
    
    def test_generate_filename(self):
        """Test filename generation."""
        filename = FileDetector.generate_filename(
            "artwork",
            "https://example.com/image.png",
            index=0
        )
        assert filename == "artwork.png"
        
        filename_indexed = FileDetector.generate_filename(
            "artwork",
            "https://example.com/image.png",
            index=1
        )
        assert filename_indexed == "artwork_1.png"
    
    def test_generate_filename_sanitize(self):
        """Test filename sanitization."""
        filename = FileDetector.generate_filename(
            "Front Logo/Design!",
            "https://example.com/image.png"
        )
        assert "/" not in filename
        assert "!" not in filename
        assert filename.endswith(".png")
    
    def test_is_production_file(self):
        """Test production file detection."""
        assert FileDetector.is_production_file("logo.dst") is True
        assert FileDetector.is_production_file("design.eps") is True
        assert FileDetector.is_production_file("artwork.png") is False
    
    def test_get_storage_path(self):
        """Test storage path mapping."""
        assert FileDetector.get_storage_path(FileType.EMBROIDERY) == 'production-files/embroidery'
        assert FileDetector.get_storage_path(FileType.VECTOR) == 'production-files/vector'
        assert FileDetector.get_storage_path(FileType.ARTWORK) == 'artwork'
        assert FileDetector.get_storage_path(FileType.DOCUMENT) == 'production-files/documents'
    
    def test_detect_from_content_png(self):
        """Test detecting PNG from magic bytes."""
        png_header = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        ext, file_type = FileDetector.detect_from_content(png_header)
        assert ext == ".png"
        assert file_type == FileType.ARTWORK
    
    def test_detect_from_content_jpg(self):
        """Test detecting JPG from magic bytes."""
        jpg_header = b'\xff\xd8\xff' + b'\x00' * 100
        ext, file_type = FileDetector.detect_from_content(jpg_header)
        assert ext == ".jpg"
        assert file_type == FileType.ARTWORK
    
    def test_detect_from_content_pdf(self):
        """Test detecting PDF from magic bytes."""
        pdf_header = b'%PDF-1.4' + b'\x00' * 100
        ext, file_type = FileDetector.detect_from_content(pdf_header)
        assert ext == ".pdf"
        assert file_type == FileType.DOCUMENT
    
    def test_detect_from_content_empty(self):
        """Test empty content."""
        ext, file_type = FileDetector.detect_from_content(b'')
        assert ext is None
        assert file_type == FileType.UNKNOWN
    
    def test_validate_file_nonexistent(self):
        """Test validation of non-existent file."""
        is_valid, error = FileDetector.validate_file(Path("/nonexistent/file.png"))
        assert is_valid is False
        assert "does not exist" in error
    
    def test_validate_file_empty(self):
        """Test validation of empty file."""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            temp_path = Path(f.name)
        
        try:
            is_valid, error = FileDetector.validate_file(temp_path)
            assert is_valid is False
            assert "empty" in error
        finally:
            temp_path.unlink()
    
    def test_validate_file_valid(self):
        """Test validation of valid file."""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as f:
            # Write PNG header
            f.write(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)
            temp_path = Path(f.name)
        
        try:
            is_valid, error = FileDetector.validate_file(temp_path)
            assert is_valid is True
            assert error == "OK"
        finally:
            temp_path.unlink()


class TestConvenienceFunctions:
    """Test convenience functions."""
    
    def test_detect_file_type_url(self):
        """Test detect_file_type with URL."""
        file_type = detect_file_type("https://example.com/logo.dst")
        assert file_type == FileType.EMBROIDERY
    
    def test_is_embroidery_file_true(self):
        """Test is_embroidery_file returns True for DST."""
        assert is_embroidery_file("https://example.com/logo.dst") is True
        assert is_embroidery_file("https://example.com/design.pes") is True
    
    def test_is_embroidery_file_false(self):
        """Test is_embroidery_file returns False for non-embroidery."""
        assert is_embroidery_file("https://example.com/image.png") is False
        assert is_embroidery_file("https://example.com/document.pdf") is False
