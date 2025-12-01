"""
PrintShop OS - Printavo Extraction Library

This package provides utilities for extracting data from Printavo
and uploading to MinIO for permanent archival.
"""

from .file_detector import FileDetector, FileType
from .printavo_api import PrintavoAPI
from .printavo_scraper import PrintavoScraper
from .minio_uploader import MinIOUploader

__all__ = [
    'FileDetector',
    'FileType',
    'PrintavoAPI',
    'PrintavoScraper',
    'MinIOUploader',
]
