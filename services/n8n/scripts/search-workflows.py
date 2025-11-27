#!/usr/bin/env python3
"""
Search the n8n-workflows collection for relevant workflows.

Usage:
    python search-workflows.py "invoice"
    python search-workflows.py "shopify" --category "E-commerce"
    python search-workflows.py --list-categories
    python search-workflows.py "email" --limit 10

Note: This script searches the workflow JSON files directly in the submodule.
For the full web-based search experience, run the n8n-workflows API server:
    cd ../n8n-workflows && python run.py
    Then visit http://localhost:8000
"""

import sys
import json
import argparse
import re
from pathlib import Path
from typing import List, Tuple, Optional

# Path to the workflows directory (relative to this script)
SCRIPT_DIR = Path(__file__).parent
SUBMODULE_DIR = SCRIPT_DIR.parent.parent / "n8n-workflows"

# Fallback if submodule is in a different location
if not SUBMODULE_DIR.exists():
    SUBMODULE_DIR = SCRIPT_DIR.parent / "n8n-workflows"


def find_workflow_files() -> List[Path]:
    """Find all workflow JSON files in the submodule."""
    if not SUBMODULE_DIR.exists():
        print(f"Error: n8n-workflows submodule not found at {SUBMODULE_DIR}")
        print("\nMake sure the submodule is initialized:")
        print("  git submodule update --init --recursive")
        sys.exit(1)
    
    # Look for JSON files in common locations
    search_paths = [
        SUBMODULE_DIR / "workflows",
        SUBMODULE_DIR / "data",
        SUBMODULE_DIR,
    ]
    
    workflow_files = []
    for path in search_paths:
        if path.exists():
            workflow_files.extend(path.glob("**/*.json"))
    
    return workflow_files


def extract_workflow_info(file_path: Path) -> Optional[dict]:
    """Extract workflow information from a JSON file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Check if this looks like an n8n workflow
        if isinstance(data, dict) and ('nodes' in data or 'name' in data):
            name = data.get('name', file_path.stem)
            description = data.get('description', '')
            nodes = data.get('nodes', [])
            
            # Try to extract category from path or tags
            category = "Uncategorized"
            tags = data.get('tags', [])
            if tags:
                if isinstance(tags[0], dict):
                    category = tags[0].get('name', category)
                elif isinstance(tags[0], str):
                    category = tags[0]
            
            # Extract from path
            try:
                relative_path = file_path.relative_to(SUBMODULE_DIR)
                parts = relative_path.parts
                if len(parts) > 1:
                    category = parts[0].replace('-', ' ').replace('_', ' ').title()
            except ValueError:
                relative_path = Path(file_path.name)
            
            return {
                'name': name,
                'description': description[:200] if description else '',
                'category': category,
                'node_count': len(nodes),
                'file_path': str(relative_path),
            }
    except (json.JSONDecodeError, UnicodeDecodeError, KeyError):
        pass
    return None


def search_workflows(query: str, category: str = None, limit: int = 20) -> List[Tuple]:
    """Search workflows by keyword and optional category."""
    workflow_files = find_workflow_files()
    results = []
    
    query_lower = query.lower()
    query_pattern = re.compile(re.escape(query_lower), re.IGNORECASE)
    
    for file_path in workflow_files:
        info = extract_workflow_info(file_path)
        if info is None:
            continue
        
        # Check if query matches name or description
        searchable = f"{info['name']} {info['description']}".lower()
        if not query_pattern.search(searchable):
            continue
        
        # Filter by category if specified
        if category and category.lower() not in info['category'].lower():
            continue
        
        results.append((
            info['name'],
            info['description'],
            info['category'],
            info['node_count'],
            info['file_path']
        ))
        
        if len(results) >= limit:
            break
    
    return results


def list_categories() -> List[Tuple[str, int]]:
    """List all available workflow categories."""
    workflow_files = find_workflow_files()
    categories = {}
    
    for file_path in workflow_files:
        info = extract_workflow_info(file_path)
        if info is None:
            continue
        
        cat = info['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    return sorted(categories.items(), key=lambda x: -x[1])


def get_workflow_stats() -> dict:
    """Get workflow collection statistics."""
    workflow_files = find_workflow_files()
    total = 0
    categories = set()
    total_nodes = 0
    
    for file_path in workflow_files:
        info = extract_workflow_info(file_path)
        if info is None:
            continue
        
        total += 1
        categories.add(info['category'])
        total_nodes += info['node_count']
    
    return {
        "total_workflows": total,
        "categories": len(categories),
        "avg_nodes": round(total_nodes / total, 1) if total > 0 else 0
    }


def print_results(results: List[Tuple]):
    """Print search results in a formatted way."""
    if not results:
        print("No workflows found matching your query.")
        print("\nTip: For the full searchable collection (4,343+ workflows), visit:")
        print("  https://zie619.github.io/n8n-workflows")
        return
    
    print(f"\nFound {len(results)} workflow(s):\n")
    print("-" * 80)
    
    for r in results:
        name, description, category, node_count, file_path = r
        description = description or "No description"
        category = category or "Uncategorized"
        
        # Truncate long descriptions
        if len(description) > 100:
            description = description[:100] + "..."
        
        print(f"[{category}] {name}")
        print(f"  Nodes: {node_count}")
        print(f"  {description}")
        if file_path:
            print(f"  File: {file_path}")
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Search the n8n-workflows collection for relevant workflows.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python search-workflows.py "invoice"
    python search-workflows.py "shopify" --category "E-commerce"
    python search-workflows.py --list-categories
    python search-workflows.py "openai" --limit 50

For the full web-based search (4,343+ workflows), visit:
    https://zie619.github.io/n8n-workflows
        """
    )
    
    parser.add_argument(
        "query",
        nargs="?",
        help="Search query (workflow name or description)"
    )
    parser.add_argument(
        "--category", "-c",
        help="Filter by category"
    )
    parser.add_argument(
        "--limit", "-l",
        type=int,
        default=20,
        help="Maximum number of results (default: 20)"
    )
    parser.add_argument(
        "--list-categories",
        action="store_true",
        help="List all available categories"
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Show collection statistics"
    )
    
    args = parser.parse_args()
    
    # Show statistics
    if args.stats:
        stats = get_workflow_stats()
        print("\nWorkflow Collection Statistics:")
        print(f"  Total workflows found: {stats['total_workflows']:,}")
        print(f"  Categories: {stats['categories']}")
        print(f"  Average nodes per workflow: {stats['avg_nodes']}")
        print("\nFor full collection stats (4,343+ workflows), visit:")
        print("  https://zie619.github.io/n8n-workflows")
        print()
        return
    
    # List categories
    if args.list_categories:
        categories = list_categories()
        if not categories:
            print("No workflow files found in submodule.")
            print("\nVisit https://zie619.github.io/n8n-workflows for the full collection.")
            return
        print("\nAvailable Categories:")
        print("-" * 40)
        for cat, count in categories:
            print(f"  {cat}: {count} workflows")
        print()
        return
    
    # Search requires a query
    if not args.query:
        parser.print_help()
        return
    
    # Perform search
    results = search_workflows(args.query, args.category, args.limit)
    print_results(results)


if __name__ == "__main__":
    main()
