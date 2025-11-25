#!/usr/bin/env python3
"""
Initialize vector database with PrintShop OS knowledge base from Markdown files
"""
import os
import glob
from typing import List, Dict

# Try importing chromadb - if fails, skip vector DB
try:
    import chromadb
    from chromadb.utils import embedding_functions
    CHROMADB_AVAILABLE = True
except ImportError:
    print("⚠️  ChromaDB not available - will skip vector database initialization")
    CHROMADB_AVAILABLE = False

# Configuration
# Determine project root relative to this script
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up 3 levels from scripts/ -> services/ -> customer-service-ai/ -> root/
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../../../"))

# Configuration
KB_ROOT = "/app/data/intelligence/knowledge_base"  # Path inside Docker container

# If running locally (not in Docker), use calculated path
if not os.path.exists(KB_ROOT):
    KB_ROOT = os.path.join(PROJECT_ROOT, "data/intelligence/knowledge_base")

if not os.path.exists(KB_ROOT):
    print(f"⚠️  Warning: Knowledge base directory not found at {KB_ROOT}")
    # Try one more fallback - current working directory
    KB_ROOT = os.path.join(os.getcwd(), "data/intelligence/knowledge_base")

def read_markdown_file(file_path: str) -> str:
    """Read content of a markdown file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def get_category_from_path(file_path: str) -> str:
    """Extract category from directory name"""
    # .../knowledge_base/operational/shipping.md -> operational
    rel_path = os.path.relpath(file_path, KB_ROOT)
    parts = rel_path.split(os.sep)
    if len(parts) > 1:
        return parts[0]
    return "general"

def initialize_vector_db():
    """Initialize ChromaDB with knowledge base from files"""
    
    print(f"🚀 Initializing Knowledge Base from: {KB_ROOT}")
    
    # Connect to ChromaDB
    # Try connecting to docker service first, fallback to local if needed
    try:
        client = chromadb.HttpClient(host="vector-db", port=8000)
        print("✅ Connected to Vector DB Service")
    except:
        print("⚠️ Could not connect to Vector DB Service, trying local persistence...")
        client = chromadb.PersistentClient(path="./data/intelligence/vector_store")

    # Create embedding function
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection (Resetting it to ensure fresh data)
    try:
        client.delete_collection(name="customer_service_kb")
        print("🗑️  Cleared existing collection")
    except:
        pass

    collection = client.get_or_create_collection(
        name="customer_service_kb",
        embedding_function=embedding_fn,
        metadata={"description": "PrintShop OS Customer Service Knowledge Base"}
    )
    
    # Walk through the knowledge base directory
    documents = []
    metadatas = []
    ids = []
    
    # Find all .md files
    md_files = glob.glob(os.path.join(KB_ROOT, "**/*.md"), recursive=True)
    
    print(f"📂 Found {len(md_files)} knowledge files")
    
    for idx, file_path in enumerate(md_files):
        content = read_markdown_file(file_path)
        if not content:
            continue
            
        filename = os.path.basename(file_path)
        category = get_category_from_path(file_path)
        
        # Simple chunking strategy: Split by headers or keep as whole document if small
        # For now, we'll ingest the whole file as one context chunk to preserve coherence
        # In a production system, we might want to split large files
        
        documents.append(content)
        metadatas.append({
            "source": filename,
            "category": category,
            "path": file_path
        })
        ids.append(f"doc_{category}_{idx}")
        
        print(f"   - Ingested: {category}/{filename}")

    if documents:
        # Ingest into vector database
        collection.add(
            documents=documents,
            metadatas=metadatas,
            ids=ids
        )
        print(f"✅ Successfully indexed {len(documents)} documents into ChromaDB")
    else:
        print("⚠️ No documents found to index!")
    
    return collection

if __name__ == "__main__":
    initialize_vector_db()
