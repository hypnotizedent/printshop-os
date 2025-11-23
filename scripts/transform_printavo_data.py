#!/usr/bin/env python3
"""
Main script to transform Printavo exports to Strapi import format.
"""

import json
import sys
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from transform.config import (
    PRINTAVO_CUSTOMERS_FILE,
    PRINTAVO_ORDERS_FILE,
    STRAPI_CUSTOMERS_FILE,
    STRAPI_JOBS_FILE,
    LATEST_EXPORT_DIR,
)
from transform.customer import transform_customers
from transform.job import transform_jobs


def load_json(file_path: Path) -> list:
    """Load JSON data from file."""
    print(f"📖 Loading {file_path.name}...")
    with open(file_path, 'r') as f:
        data = json.load(f)
    print(f"   Loaded {len(data)} records")
    return data


def save_json(data: list, file_path: Path):
    """Save data to JSON file."""
    print(f"💾 Saving to {file_path.name}...")
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"   Saved {len(data)} records ({file_path.stat().st_size / 1024:.1f} KB)")


def main(sample_size: int = None):
    """
    Transform Printavo data to Strapi format.
    
    Args:
        sample_size: If provided, only transform first N records (for testing)
    """
    print("=" * 70)
    print("🔄 Printavo → Strapi Data Transformation")
    print("=" * 70)
    print(f"\nUsing export: {LATEST_EXPORT_DIR.name}")
    print()
    
    # Load Printavo data
    printavo_customers = load_json(PRINTAVO_CUSTOMERS_FILE)
    printavo_orders = load_json(PRINTAVO_ORDERS_FILE)
    print()
    
    # Apply sample size if specified
    if sample_size:
        print(f"⚠️  SAMPLE MODE: Processing only first {sample_size} records")
        printavo_customers = printavo_customers[:sample_size]
        printavo_orders = printavo_orders[:sample_size]
        print()
    
    # Transform customers
    print("=" * 70)
    print("👥 Transforming Customers")
    print("=" * 70)
    strapi_customers = transform_customers(printavo_customers)
    print(f"✅ Transformed {len(strapi_customers)} customers")
    print()
    
    # Create Printavo customer_id to array index mapping
    # (In real import, this would use actual Strapi IDs after customer import)
    customer_id_map = {}
    for i, customer in enumerate(printavo_customers):
        printavo_id = customer.get('id')
        if printavo_id:
            # Use index as placeholder for Strapi ID
            customer_id_map[printavo_id] = i + 1  # Strapi IDs start at 1
    
    # Transform orders/jobs
    print("=" * 70)
    print("📋 Transforming Orders/Jobs")
    print("=" * 70)
    strapi_jobs = transform_jobs(printavo_orders, customer_id_map)
    print(f"✅ Transformed {len(strapi_jobs)} jobs")
    print()
    
    # Save transformed data
    print("=" * 70)
    print("💾 Saving Transformed Data")
    print("=" * 70)
    save_json(strapi_customers, STRAPI_CUSTOMERS_FILE)
    save_json(strapi_jobs, STRAPI_JOBS_FILE)
    print()
    
    # Summary statistics
    print("=" * 70)
    print("📊 Transformation Summary")
    print("=" * 70)
    print(f"   Customers: {len(strapi_customers)}")
    print(f"   Jobs: {len(strapi_jobs)}")
    
    # Status breakdown
    status_counts = {}
    for job in strapi_jobs:
        status = job['data'].get('Status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    
    print("\n   Job Status Breakdown:")
    for status, count in sorted(status_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"      {status}: {count}")
    
    print("\n" + "=" * 70)
    print("✅ Transformation Complete!")
    print("=" * 70)
    print(f"\n📁 Output files:")
    print(f"   {STRAPI_CUSTOMERS_FILE}")
    print(f"   {STRAPI_JOBS_FILE}")
    print()


if __name__ == "__main__":
    # Check for sample size argument
    sample_size = None
    if len(sys.argv) > 1:
        try:
            sample_size = int(sys.argv[1])
        except ValueError:
            print("Usage: python3 transform_printavo_data.py [sample_size]")
            print("\nExamples:")
            print("  python3 transform_printavo_data.py        # Transform all records")
            print("  python3 transform_printavo_data.py 100    # Transform first 100 records")
            sys.exit(1)
    
    main(sample_size=sample_size)
