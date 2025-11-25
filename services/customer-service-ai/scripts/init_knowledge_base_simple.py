#!/usr/bin/env python3
"""
Simple knowledge base initialization - just lists what would be indexed
"""
import os
import glob

# Configuration
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
KB_ROOT = os.path.join(PROJECT_ROOT, "data/intelligence/knowledge_base")

def main():
    print(f"📂 Knowledge Base Location: {KB_ROOT}")
    
    if not os.path.exists(KB_ROOT):
        print(f"❌ Directory not found!")
        return
    
    # Find all markdown files
    md_files = glob.glob(os.path.join(KB_ROOT, "**/*.md"), recursive=True)
    
    print(f"\n✅ Found {len(md_files)} markdown files:\n")
    
    categories = {}
    for file_path in md_files:
        rel_path = os.path.relpath(file_path, KB_ROOT)
        category = rel_path.split(os.sep)[0]
        
        if category not in categories:
            categories[category] = []
        categories[category].append(os.path.basename(file_path))
    
    for category, files in sorted(categories.items()):
        print(f"\n📁 {category}/ ({len(files)} files)")
        for filename in sorted(files):
            print(f"   - {filename}")
    
    print(f"\n✅ Knowledge base is ready for vector DB indexing")
    print(f"   Total documents: {len(md_files)}")
    print(f"   Categories: {', '.join(sorted(categories.keys()))}")

if __name__ == "__main__":
    main()
