import json
from pathlib import Path
from collections import defaultdict

def analyze_file(file_path):
    print(f"\n🔍 Analyzing {file_path}...")
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return

    if not data:
        print("⚠️  File is empty")
        return

    total_records = len(data)
    print(f"   Total Records: {total_records}")

    # Analyze keys
    field_stats = defaultdict(lambda: {"count": 0, "types": set(), "examples": []})
    
    for record in data:
        # Handle Strapi import format where fields are wrapped in "data"
        if "data" in record and isinstance(record["data"], dict):
            content = record["data"]
        else:
            content = record

        for key, value in content.items():
            stats = field_stats[key]
            stats["count"] += 1
            
            # Track type
            val_type = type(value).__name__
            if value is None:
                val_type = "null"
            stats["types"].add(val_type)
            
            # Keep a few examples (if not null)
            if value is not None and len(stats["examples"]) < 3:
                # Truncate long values for display
                val_str = str(value)
                if len(val_str) > 50:
                    val_str = val_str[:47] + "..."
                stats["examples"].append(val_str)

    # Print Report
    print(f"\n   {'FIELD':<25} | {'USAGE':<8} | {'TYPES':<15} | {'EXAMPLES'}")
    print("   " + "-"*100)
    
    sorted_fields = sorted(field_stats.items(), key=lambda x: x[1]['count'], reverse=True)
    
    for field, stats in sorted_fields:
        usage_pct = (stats['count'] / total_records) * 100
        types_str = ", ".join(sorted(list(stats['types'])))
        examples_str = ", ".join(stats['examples'])
        print(f"   {field:<25} | {usage_pct:>6.1f}% | {types_str:<15} | {examples_str}")

if __name__ == "__main__":
    # Paths based on project structure
    project_root = Path(__file__).parent.parent
    base_path = project_root / "data" / "processed" / "strapi-imports"
    
    analyze_file(base_path / "customers.json")
    analyze_file(base_path / "jobs.json")
