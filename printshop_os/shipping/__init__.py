"""
PrintShop OS - Shipping Module
Handles shipping integrations including label creation, tracking, and fulfillment.
"""

from .easypost_client import EasyPostClient

__all__ = ["EasyPostClient"]
