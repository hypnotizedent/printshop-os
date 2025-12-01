#!/usr/bin/env python3
"""
Product Analyzer - Analyze order history to identify top products

Analyzes Printavo line items to calculate:
- Order frequency per product
- Total units ordered
- Recency of orders
- Weighted score combining all factors

Usage:
    from scripts.lib.product_analyzer import ProductAnalyzer
    
    analyzer = ProductAnalyzer()
    top_products = analyzer.analyze()
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict


@dataclass
class TopProduct:
    """Represents a top product with usage statistics"""
    style_number: str
    style_name: str
    order_count: int = 0
    total_quantity: int = 0
    last_used: Optional[str] = None
    categories: List[str] = field(default_factory=list)
    sample_colors: List[str] = field(default_factory=list)
    score: float = 0.0  # Weighted score
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)


class ProductAnalyzer:
    """
    Analyzes Printavo order history to identify top products.
    
    Uses a weighted scoring system:
    - Order frequency (40%)
    - Total volume (30%)
    - Recency bonus (30%)
    """
    
    # Scoring weights
    WEIGHT_FREQUENCY = 0.4
    WEIGHT_VOLUME = 0.3
    WEIGHT_RECENCY = 0.3
    
    # Recency window in days
    RECENCY_WINDOW_DAYS = 90
    
    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize the analyzer.
        
        Args:
            data_dir: Path to data directory. Defaults to project data/ folder.
        """
        self.data_dir = Path(data_dir) if data_dir else self._find_data_dir()
        self.products: Dict[str, TopProduct] = {}
        self.orders_path: Optional[Path] = None
        self.line_items_processed = 0
        self.orders_processed = 0
        
    def _find_data_dir(self) -> Path:
        """Find the project data directory"""
        # Try relative to this script
        script_dir = Path(__file__).parent.parent.parent
        data_dir = script_dir / 'data'
        
        if data_dir.exists():
            return data_dir
            
        # Try from current working directory
        cwd_data = Path.cwd() / 'data'
        if cwd_data.exists():
            return cwd_data
            
        raise FileNotFoundError("Could not find data directory")
        
    def _find_orders_file(self) -> Path:
        """Find the Printavo orders export file"""
        # Check for raw exports first
        raw_exports = self.data_dir / 'raw' / 'printavo-exports'
        
        if raw_exports.exists():
            # Find most recent export
            export_dirs = sorted(
                [d for d in raw_exports.iterdir() if d.is_dir() and d.name.startswith('printavo_')],
                key=lambda d: d.name,
                reverse=True
            )
            
            # Also check for complete_* directories
            complete_dirs = sorted(
                [d for d in raw_exports.iterdir() if d.is_dir() and d.name.startswith('complete_')],
                key=lambda d: d.name,
                reverse=True
            )
            
            all_dirs = complete_dirs + export_dirs
            
            for export_dir in all_dirs:
                orders_file = export_dir / 'orders.json'
                if orders_file.exists():
                    return orders_file
                    
        # Fall back to processed data
        processed = self.data_dir / 'processed' / 'orders_with_images.json'
        if processed.exists():
            return processed
            
        raise FileNotFoundError(
            f"Could not find orders export. Looked in:\n"
            f"  - {raw_exports}\n"
            f"  - {self.data_dir / 'processed'}"
        )
        
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse a date string from Printavo export"""
        if not date_str:
            return None
            
        try:
            # Handle ISO format with timezone
            if '+' in date_str or 'Z' in date_str:
                # Remove timezone for parsing, then convert to UTC
                if date_str.endswith('Z'):
                    date_str = date_str[:-1] + '+00:00'
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                return datetime.fromisoformat(date_str)
        except (ValueError, TypeError):
            return None
            
    def _calculate_recency_score(self, last_used: Optional[str]) -> float:
        """
        Calculate recency bonus (0-1).
        Products used within RECENCY_WINDOW_DAYS get higher scores.
        """
        if not last_used:
            return 0.0
            
        last_date = self._parse_date(last_used)
        if not last_date:
            return 0.0
            
        now = datetime.now(timezone.utc)
        
        # Make last_date timezone aware if it isn't
        if last_date.tzinfo is None:
            last_date = last_date.replace(tzinfo=timezone.utc)
            
        days_ago = (now - last_date).days
        
        if days_ago <= 0:
            return 1.0
        elif days_ago >= self.RECENCY_WINDOW_DAYS:
            return 0.0
        else:
            # Linear decay
            return 1.0 - (days_ago / self.RECENCY_WINDOW_DAYS)
            
    def _normalize_scores(self):
        """Normalize product scores to 0-100 range"""
        if not self.products:
            return
            
        # Find max values for normalization
        max_orders = max(p.order_count for p in self.products.values())
        max_quantity = max(p.total_quantity for p in self.products.values())
        
        if max_orders == 0:
            max_orders = 1
        if max_quantity == 0:
            max_quantity = 1
            
        for product in self.products.values():
            # Normalize each component to 0-1
            freq_score = product.order_count / max_orders
            vol_score = product.total_quantity / max_quantity
            recency_score = self._calculate_recency_score(product.last_used)
            
            # Weighted combination
            raw_score = (
                self.WEIGHT_FREQUENCY * freq_score +
                self.WEIGHT_VOLUME * vol_score +
                self.WEIGHT_RECENCY * recency_score
            )
            
            # Scale to 0-100
            product.score = round(raw_score * 100, 2)
            
    def analyze(self, limit: int = 500) -> List[TopProduct]:
        """
        Analyze order history and return top products.
        
        Args:
            limit: Maximum number of products to return
            
        Returns:
            List of TopProduct objects sorted by score
        """
        self.orders_path = self._find_orders_file()
        print(f"📊 Loading orders from: {self.orders_path}")
        
        with open(self.orders_path, 'r') as f:
            orders = json.load(f)
            
        print(f"   Found {len(orders)} orders")
        
        # Process each order
        for order in orders:
            self.orders_processed += 1
            line_items = order.get('lineitems_attributes') or []
            
            for item in line_items:
                self._process_line_item(item, order)
                
        print(f"   Processed {self.line_items_processed} line items")
        print(f"   Found {len(self.products)} unique products")
        
        # Calculate scores
        self._normalize_scores()
        
        # Sort by score and return top products
        sorted_products = sorted(
            self.products.values(),
            key=lambda p: p.score,
            reverse=True
        )
        
        return sorted_products[:limit]
        
    def _process_line_item(self, item: Dict[str, Any], order: Dict[str, Any]):
        """Process a single line item and update product statistics"""
        self.line_items_processed += 1
        
        style_number = (item.get('style_number') or '').upper().strip()
        if not style_number:
            return
            
        style_name = item.get('style_description') or 'Unknown Product'
        quantity = max(1, int(item.get('total_quantities') or 1))
        category = item.get('category') or 'Unknown'
        color = item.get('color') or ''
        order_date = order.get('created_at')
        
        if style_number in self.products:
            product = self.products[style_number]
            product.order_count += 1
            product.total_quantity += quantity
            
            # Update categories
            if category and category not in product.categories:
                product.categories.append(category)
                
            # Update sample colors (limit to 5)
            if color and color not in product.sample_colors and len(product.sample_colors) < 5:
                product.sample_colors.append(color)
                
            # Update last used date if more recent
            if order_date:
                current_date = self._parse_date(product.last_used)
                new_date = self._parse_date(order_date)
                
                if new_date and (not current_date or new_date > current_date):
                    product.last_used = order_date
        else:
            self.products[style_number] = TopProduct(
                style_number=style_number,
                style_name=style_name,
                order_count=1,
                total_quantity=quantity,
                last_used=order_date,
                categories=[category] if category else [],
                sample_colors=[color] if color else []
            )
            
    def save_results(self, products: List[TopProduct], output_path: Optional[str] = None) -> str:
        """
        Save analysis results to JSON file.
        
        Args:
            products: List of TopProduct objects
            output_path: Optional output path. Defaults to data/intelligence/top-500-products.json
            
        Returns:
            Path to saved file
        """
        if output_path:
            out_path = Path(output_path)
        else:
            out_path = self.data_dir / 'intelligence' / 'top-500-products.json'
            
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        result = {
            'generatedAt': datetime.now(timezone.utc).isoformat(),
            'sourceFile': str(self.orders_path),
            'totalOrders': self.orders_processed,
            'totalLineItems': self.line_items_processed,
            'totalUniqueProducts': len(self.products),
            'topProductCount': len(products),
            'scoringWeights': {
                'frequency': self.WEIGHT_FREQUENCY,
                'volume': self.WEIGHT_VOLUME,
                'recency': self.WEIGHT_RECENCY,
                'recencyWindowDays': self.RECENCY_WINDOW_DAYS
            },
            'products': [p.to_dict() for p in products]
        }
        
        with open(out_path, 'w') as f:
            json.dump(result, f, indent=2)
            
        print(f"✅ Saved results to: {out_path}")
        return str(out_path)
        
    def get_product_by_sku(self, sku: str) -> Optional[TopProduct]:
        """Get product statistics by SKU"""
        return self.products.get(sku.upper())
        
    def print_summary(self, products: List[TopProduct], limit: int = 20):
        """Print a summary of top products"""
        print("\n📋 Top Products Summary:")
        print("─" * 80)
        print(f"{'Rank':<5} {'SKU':<15} {'Orders':>8} {'Units':>10} {'Score':>8} {'Name':<35}")
        print("─" * 80)
        
        for i, product in enumerate(products[:limit], 1):
            name = product.style_name.replace('\r\n', ' ').replace('\n', ' ')[:35]
            print(
                f"{i:<5} {product.style_number:<15} {product.order_count:>8} "
                f"{product.total_quantity:>10} {product.score:>8.1f} {name:<35}"
            )
            
        if len(products) > limit:
            print(f"\n... and {len(products) - limit} more products")


def main():
    """Command-line entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Analyze order history for top products')
    parser.add_argument('--limit', type=int, default=500, help='Number of top products to analyze')
    parser.add_argument('--output', type=str, help='Output file path')
    parser.add_argument('--summary', action='store_true', help='Print summary to console')
    parser.add_argument('--data-dir', type=str, help='Data directory path')
    
    args = parser.parse_args()
    
    analyzer = ProductAnalyzer(data_dir=args.data_dir)
    products = analyzer.analyze(limit=args.limit)
    
    if args.summary or True:  # Always print summary
        analyzer.print_summary(products)
        
    analyzer.save_results(products, output_path=args.output)


if __name__ == '__main__':
    main()
