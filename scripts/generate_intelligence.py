"""
Generate intelligence reports from raw Printavo data.
Creates summarized views optimized for LLM context.
"""

import json
import csv
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from transform.config import LATEST_EXPORT_DIR
from transform.utils import parse_decimal

# Output paths
PROJECT_ROOT = Path(__file__).parent.parent
INTELLIGENCE_DIR = PROJECT_ROOT / "data" / "intelligence" / "context"

# Ensure directory exists
INTELLIGENCE_DIR.mkdir(parents=True, exist_ok=True)

FINANCIAL_SUMMARY_FILE = INTELLIGENCE_DIR / "financial_summary.md"
TOP_CUSTOMERS_FILE = INTELLIGENCE_DIR / "top_customers.csv"
PRODUCT_TRENDS_FILE = INTELLIGENCE_DIR / "product_trends.md"

def load_data():
    """Load raw data from latest export."""
    print(f"📖 Loading data from {LATEST_EXPORT_DIR.name}...")
    
    with open(LATEST_EXPORT_DIR / "orders.json", 'r') as f:
        orders = json.load(f)
        
    with open(LATEST_EXPORT_DIR / "customers.json", 'r') as f:
        customers = json.load(f)
        
    return orders, customers

def generate_financial_summary(orders):
    """Generate a markdown financial summary."""
    print("📊 Generating financial summary...")
    
    total_revenue = 0
    total_paid = 0
    orders_count = len(orders)
    
    # Monthly revenue aggregation
    monthly_revenue = defaultdict(float)
    yearly_revenue = defaultdict(float)
    
    for order in orders:
        total = parse_decimal(order.get('order_total', 0))
        paid = parse_decimal(order.get('amount_paid', 0))
        
        total_revenue += total
        total_paid += paid
        
        # Date parsing
        created_at = order.get('created_at')
        if created_at:
            try:
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                month_key = dt.strftime('%Y-%m')
                year_key = dt.strftime('%Y')
                
                monthly_revenue[month_key] += total
                yearly_revenue[year_key] += total
            except (ValueError, AttributeError):
                pass
    
    # Calculate averages
    avg_order_value = total_revenue / orders_count if orders_count > 0 else 0
    
    # Write report
    with open(FINANCIAL_SUMMARY_FILE, 'w') as f:
        f.write("# Financial Summary Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}\n")
        f.write(f"**Data Source:** {LATEST_EXPORT_DIR.name}\n\n")
        
        f.write("## Key Metrics\n")
        f.write(f"- **Total Lifetime Revenue:** ${total_revenue:,.2f}\n")
        f.write(f"- **Total Amount Paid:** ${total_paid:,.2f}\n")
        f.write(f"- **Outstanding Balance:** ${(total_revenue - total_paid):,.2f}\n")
        f.write(f"- **Total Orders:** {orders_count:,}\n")
        f.write(f"- **Average Order Value:** ${avg_order_value:,.2f}\n\n")
        
        f.write("## Yearly Revenue\n")
        f.write("| Year | Revenue |\n")
        f.write("|------|---------|\n")
        for year in sorted(yearly_revenue.keys(), reverse=True):
            f.write(f"| {year} | ${yearly_revenue[year]:,.2f} |\n")
        
        f.write("\n## Monthly Revenue (Last 24 Months)\n")
        f.write("| Month | Revenue |\n")
        f.write("|-------|---------|\n")
        
        # Sort months and take last 24
        sorted_months = sorted(monthly_revenue.keys(), reverse=True)[:24]
        for month in sorted_months:
            f.write(f"| {month} | ${monthly_revenue[month]:,.2f} |\n")

def generate_top_customers(orders, customers):
    """Generate CSV of top customers by revenue."""
    print("👥 Generating top customers report...")
    
    customer_revenue = defaultdict(float)
    customer_orders = defaultdict(int)
    customer_last_order = {}
    
    # Map customer ID to name
    customer_map = {c['id']: c.get('name') or f"{c.get('first_name', '')} {c.get('last_name', '')}".strip() or c.get('company', 'Unknown') for c in customers}
    customer_emails = {c['id']: c.get('email') or c.get('customer_email', '') for c in customers}
    
    for order in orders:
        cust_id = order.get('customer_id')
        if not cust_id:
            continue
            
        total = parse_decimal(order.get('order_total', 0))
        customer_revenue[cust_id] += total
        customer_orders[cust_id] += 1
        
        # Track last order date
        created_at = order.get('created_at')
        if created_at:
            if cust_id not in customer_last_order or created_at > customer_last_order[cust_id]:
                customer_last_order[cust_id] = created_at
    
    # Sort by revenue
    sorted_customers = sorted(customer_revenue.items(), key=lambda x: x[1], reverse=True)
    
    # Write CSV
    with open(TOP_CUSTOMERS_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['Rank', 'Customer Name', 'Email', 'Total Revenue', 'Order Count', 'Avg Order Value', 'Last Order Date'])
        
        for rank, (cust_id, revenue) in enumerate(sorted_customers[:500], 1):
            name = customer_map.get(cust_id, 'Unknown')
            email = customer_emails.get(cust_id, '')
            count = customer_orders[cust_id]
            avg = revenue / count if count > 0 else 0
            last_date = customer_last_order.get(cust_id, '').split('T')[0]
            
            writer.writerow([rank, name, email, f"{revenue:.2f}", count, f"{avg:.2f}", last_date])

def main():
    print("🧠 Generating Intelligence Reports...")
    orders, customers = load_data()
    
    generate_financial_summary(orders)
    generate_top_customers(orders, customers)
    
    print("\n✅ Intelligence generation complete!")
    print(f"   - {FINANCIAL_SUMMARY_FILE}")
    print(f"   - {TOP_CUSTOMERS_FILE}")

if __name__ == "__main__":
    main()
