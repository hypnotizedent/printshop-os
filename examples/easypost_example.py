#!/usr/bin/env python3
"""
EasyPost Integration Example for PrintShop OS

This script demonstrates how to use the EasyPost client to create shipments,
compare rates, and purchase shipping labels.

Prerequisites:
1. Install dependencies: pip install -r requirements.txt
2. Set EASYPOST_API_KEY in your .env file or environment
3. Use test API key for development

Usage:
    python examples/easypost_example.py
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from printshop_os.shipping import EasyPostClient


def main():
    """Run EasyPost integration example."""
    print("=" * 70)
    print("PrintShop OS - EasyPost Integration Example")
    print("=" * 70)
    print()
    
    # Check if API key is configured
    if not os.getenv("EASYPOST_API_KEY"):
        print("❌ ERROR: EASYPOST_API_KEY not found in environment")
        print()
        print("Please set your EasyPost API key:")
        print("  1. Copy .env.example to .env")
        print("  2. Add your API key to .env file")
        print("  3. Or export EASYPOST_API_KEY=your_key")
        print()
        print("Get your API key at: https://www.easypost.com/account/api-keys")
        return 1
    
    try:
        # Initialize EasyPost client
        print("🔧 Initializing EasyPost client...")
        client = EasyPostClient()
        print(f"✅ Client initialized in {client.mode} mode")
        print()
        
        # Use EasyPost test addresses
        print("📦 Creating test shipment...")
        from_address = {
            "name": "PrintShop OS",
            "street1": "417 Montgomery Street",
            "street2": "Floor 5",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94104",
            "country": "US",
            "phone": "4155551234"
        }
        
        to_address = {
            "name": "Test Customer",
            "street1": "179 N Harbor Dr",
            "city": "Redondo Beach",
            "state": "CA",
            "zip": "90277",
            "country": "US",
            "phone": "3105551234"
        }
        
        parcel = {
            "length": 10,   # inches
            "width": 8,     # inches
            "height": 4,    # inches
            "weight": 15.5  # ounces
        }
        
        shipment = client.create_shipment(from_address, to_address, parcel)
        print(f"✅ Shipment created: {shipment['id']}")
        print()
        
        # List available rates
        print("💰 Available shipping rates:")
        print("-" * 70)
        rates = client.list_rates(shipment['id'])
        
        for i, rate in enumerate(rates, 1):
            delivery = f"{rate['delivery_days']} days" if rate['delivery_days'] else "Unknown"
            print(f"{i}. {rate['carrier']:12} {rate['service']:25} ${rate['rate']:>6}  ({delivery})")
        
        print("-" * 70)
        print(f"Total rates available: {len(rates)}")
        print()
        
        # Note about purchasing
        print("📋 Next Steps:")
        print("  - To purchase a label, call: client.buy_shipment(shipment['id'])")
        print("  - This will charge your EasyPost account")
        print("  - The label can be downloaded and printed")
        print("  - A tracking code will be provided")
        print()
        
        print("✅ Example completed successfully!")
        print()
        print("📚 For more information, see:")
        print("  - docs/api/easypost-integration.md")
        print("  - printshop_os/README.md")
        
        return 0
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
