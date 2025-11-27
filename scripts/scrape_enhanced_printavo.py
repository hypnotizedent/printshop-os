#!/usr/bin/env python3
"""
Enhanced Printavo Scraper - Extracts imprints, line items, and mockups from public invoice pages.
This gets data that's NOT available via the API!
"""

import json
import time
import random
import requests
from bs4 import BeautifulSoup
from pathlib import Path
import sys
import re

# Configuration
DATA_DIR = Path(__file__).parent.parent / "data"
INPUT_FILE = DATA_DIR / "processed" / "orders_with_images.json"
OUTPUT_FILE = DATA_DIR / "processed" / "orders_enhanced.json"
CHECKPOINT_FILE = DATA_DIR / "enhanced-scrape-checkpoint.json"
USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'

def load_orders():
    """Load previously scraped orders."""
    if not INPUT_FILE.exists():
        print(f"❌ Input file not found: {INPUT_FILE}")
        return []
    with open(INPUT_FILE, 'r') as f:
        return json.load(f)

def load_checkpoint():
    """Load checkpoint of processed orders."""
    if CHECKPOINT_FILE.exists():
        with open(CHECKPOINT_FILE, 'r') as f:
            return json.load(f)
    return {"processed_ids": []}

def save_checkpoint(checkpoint):
    """Save checkpoint."""
    with open(CHECKPOINT_FILE, 'w') as f:
        json.dump(checkpoint, f)

def extract_imprints(soup):
    """Extract imprint/print location data from the page."""
    imprints = []
    
    # Find imprint containers
    imprint_fields = soup.select('.fields-for-imprint')
    
    for field in imprint_fields:
        imprint = {}
        
        # Get imprint name/location
        name_el = field.select_one('.imprint__pricing-matrix-name')
        if name_el:
            imprint['name'] = name_el.get_text(strip=True)
        
        # Get any descriptions
        desc = field.select_one('.imprint-description, [class*="description"]')
        if desc:
            imprint['description'] = desc.get_text(strip=True)
        
        # Get mockup images for this imprint
        mockups = field.select('img')
        imprint['mockups'] = [img.get('src') for img in mockups if img.get('src')]
        
        # Get color info if present
        colors = field.select('[class*="color"]')
        imprint['colors'] = [c.get_text(strip=True) for c in colors if c.get_text(strip=True)]
        
        if imprint.get('name') or imprint.get('mockups'):
            imprints.append(imprint)
    
    return imprints

def extract_line_items(soup):
    """Extract line item details from the page."""
    line_items = []
    
    # Find line item detail rows
    li_details = soup.select('.line-item-detail')
    
    for detail in li_details:
        item = {}
        
        # Get the full text content
        text = detail.get_text(strip=True)
        item['raw_text'] = text
        
        # Try to parse category (usually first)
        labels = detail.select('.line-item-labels span')
        if labels:
            item['labels'] = [l.get_text(strip=True) for l in labels]
        
        # Get description
        desc = detail.select_one('[class*="description"]')
        if desc:
            item['description'] = desc.get_text(strip=True)
        
        # Get quantity and price (usually in specific spans)
        qty = detail.select_one('[class*="quantity"], [class*="qty"]')
        if qty:
            try:
                item['quantity'] = int(re.sub(r'[^\d]', '', qty.get_text()))
            except ValueError:
                pass
        
        price = detail.select_one('[class*="price"]')
        if price:
            price_text = price.get_text(strip=True)
            match = re.search(r'\$?([\d,]+\.?\d*)', price_text)
            if match:
                item['price'] = float(match.group(1).replace(',', ''))
        
        # Get any images
        imgs = detail.select('img')
        item['images'] = [img.get('src') for img in imgs if img.get('src')]
        
        if item:
            line_items.append(item)
    
    return line_items

def extract_all_mockups(soup):
    """Extract ALL mockup/artwork images from the page."""
    mockups = []
    
    # Various selectors for mockups
    selectors = [
        '.line-item-mockups-well img',
        '.imprint__mockups-well img',
        '.invoice-image img',
        'a .invoice-image',
        '.asset-thumbnail img',
        'img[src*="filepicker"]',
        'img[src*="filestack"]',
    ]
    
    for selector in selectors:
        for el in soup.select(selector):
            if el.name == 'img':
                src = el.get('src')
            else:
                # It's an anchor, look for href
                src = el.get('href') or el.select_one('img').get('src') if el.select_one('img') else None
            
            if src and src not in mockups:
                # Try to get the full-res version
                if 'resize=' in src:
                    # Remove resize transform for full res
                    full_src = re.sub(r'/resize=[^/]+/', '/', src)
                    mockups.append(full_src)
                else:
                    mockups.append(src)
    
    return list(set(mockups))

def scrape_enhanced_data(public_url):
    """Scrape enhanced data from a public invoice page."""
    if not public_url:
        return None
    
    try:
        time.sleep(random.uniform(0.5, 1.0))
        
        response = requests.get(
            public_url,
            headers={'User-Agent': USER_AGENT},
            timeout=15
        )
        
        if response.status_code != 200:
            return None
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        return {
            'imprints': extract_imprints(soup),
            'line_item_details': extract_line_items(soup),
            'all_mockups': extract_all_mockups(soup),
        }
        
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:50]}")
        return None

def main():
    print("=" * 60)
    print("🔍 Enhanced Printavo Scraper")
    print("   Extracts: Imprints, Line Items, Mockups")
    print("=" * 60)
    
    orders = load_orders()
    print(f"   Loaded {len(orders):,} orders")
    
    checkpoint = load_checkpoint()
    processed_ids = set(checkpoint.get("processed_ids", []))
    print(f"   Already processed: {len(processed_ids):,}")
    
    # Filter for orders with public URLs not yet processed
    to_process = [o for o in orders if o.get('public_url') and str(o['id']) not in processed_ids]
    print(f"   To process: {len(to_process):,}")
    print()
    
    if not to_process:
        print("✅ All orders already processed!")
        return
    
    enhanced_orders = []
    
    # Load any existing enhanced data
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r') as f:
            enhanced_orders = json.load(f)
    
    try:
        for i, order in enumerate(to_process):
            order_id = str(order['id'])
            visual_id = order.get('visual_id', 'N/A')
            
            print(f"[{i+1}/{len(to_process)}] Order #{visual_id}...", end=" ")
            
            enhanced = scrape_enhanced_data(order.get('public_url'))
            
            if enhanced:
                order['enhanced_data'] = enhanced
                imprint_count = len(enhanced.get('imprints', []))
                mockup_count = len(enhanced.get('all_mockups', []))
                print(f"✓ {imprint_count} imprints, {mockup_count} mockups")
            else:
                print("⚠️ No data")
            
            enhanced_orders.append(order)
            processed_ids.add(order_id)
            
            # Save checkpoint every 25 orders
            if (i + 1) % 25 == 0:
                print("   💾 Saving checkpoint...")
                checkpoint["processed_ids"] = list(processed_ids)
                save_checkpoint(checkpoint)
                
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(enhanced_orders, f, indent=2)
    
    except KeyboardInterrupt:
        print("\n🛑 Interrupted. Saving progress...")
    
    # Final save
    checkpoint["processed_ids"] = list(processed_ids)
    save_checkpoint(checkpoint)
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(enhanced_orders, f, indent=2)
    
    print()
    print("=" * 60)
    print("✅ Scraping Complete")
    print(f"   Processed: {len(enhanced_orders):,} orders")
    print(f"   Saved to: {OUTPUT_FILE}")
    print("=" * 60)

if __name__ == "__main__":
    main()
