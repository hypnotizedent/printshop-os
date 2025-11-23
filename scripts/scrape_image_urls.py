"""
Scrape image URLs from Printavo public invoice pages.
Extracts metadata only (URLs) without downloading files to save disk space.
"""

import json
import time
import random
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from transform.config import LATEST_EXPORT_DIR, DATA_DIR

# Config
INPUT_FILE = LATEST_EXPORT_DIR / "orders.json"
OUTPUT_FILE = DATA_DIR / "processed" / "orders_with_images.json"
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'

def load_orders():
    if not INPUT_FILE.exists():
        print(f"❌ Input file not found: {INPUT_FILE}")
        return []
    print(f"📖 Loading orders from {INPUT_FILE.name}...")
    with open(INPUT_FILE, 'r') as f:
        return json.load(f)

def scrape_invoice_images(public_url):
    """
    Visits the public invoice URL and extracts image links.
    Returns a list of image URLs.
    """
    if not public_url:
        return []

    try:
        # Add random delay to be polite and avoid blocking
        time.sleep(random.uniform(0.5, 1.5))
        
        response = requests.get(public_url, headers={'User-Agent': USER_AGENT}, timeout=10)
        if response.status_code != 200:
            print(f"   ⚠️ Failed to fetch {public_url}: Status {response.status_code}")
            return []

        soup = BeautifulSoup(response.content, 'html.parser')
        
        image_urls = []
        
        # Look for invoice images (based on standard Printavo structure)
        # Selectors target the image inside the invoice-image class
        images = soup.select('.invoice-image img')
        for img in images:
            src = img.get('src')
            if src:
                image_urls.append(src)
        
        # Also check for links wrapping the images (often high-res versions)
        image_links = soup.select('a .invoice-image')
        for img_div in image_links:
            parent = img_div.find_parent('a')
            if parent and parent.get('href'):
                image_urls.append(parent.get('href'))

        return list(set(image_urls)) # Remove duplicates

    except Exception as e:
        print(f"   ❌ Error scraping {public_url}: {str(e)}")
        return []

def main():
    print("="*60)
    print("🔍 Printavo Image URL Extractor")
    print("="*60)
    
    orders = load_orders()
    print(f"   Loaded {len(orders)} orders.")

    # Check if we have a checkpoint to resume from
    processed_orders = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, 'r') as f:
                processed_orders = json.load(f)
            print(f"   Resuming from {len(processed_orders)} processed orders.")
        except json.JSONDecodeError:
            print("   ⚠️ Output file corrupted, starting fresh.")
    
    # Create a map of processed IDs for fast lookup
    processed_ids = {str(o['id']) for o in processed_orders}
    
    # Filter for orders with public URLs
    orders_to_process = [o for o in orders if o.get('public_url')]
    print(f"   Found {len(orders_to_process)} orders with public URLs.")
    
    count = 0
    try:
        for i, order in enumerate(orders_to_process):
            order_id = str(order.get('id'))
            
            if order_id in processed_ids:
                continue

            visual_id = order.get('visual_id')
            public_url = order.get('public_url')
            
            print(f"[{i+1}/{len(orders_to_process)}] Scraping Order #{visual_id}...")
            
            # Scrape
            images = scrape_invoice_images(public_url)
            
            if images:
                print(f"      Found {len(images)} images")
            
            # Enrich order object
            order['scraped_images'] = images
            processed_orders.append(order)
            
            count += 1
            
            # Save checkpoint every 20 orders
            if count % 20 == 0:
                print("   💾 Saving checkpoint...")
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(processed_orders, f, indent=2)

    except KeyboardInterrupt:
        print("\n🛑 Stopped by user. Saving progress...")
    
    # Final Save
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(processed_orders, f, indent=2)
    
    print("\n" + "="*60)
    print("✅ Extraction Complete (or Stopped)")
    print(f"   Total processed: {len(processed_orders)}")
    print(f"   Saved to: {OUTPUT_FILE}")
    print("="*60)

if __name__ == "__main__":
    main()
