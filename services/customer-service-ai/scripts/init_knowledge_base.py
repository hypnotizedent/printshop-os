#!/usr/bin/env python3
"""
Initialize vector database with PrintShop OS knowledge base
"""
import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict
import json

# FAQ Data Structure
FAQ_DATA = [
    {
        "question": "What is your turnaround time for orders?",
        "answer": "Our standard turnaround time is 7-10 business days. Rush orders (3-5 days) are available for an additional fee. Custom designs may require additional time for approval.",
        "category": "shipping",
        "keywords": ["turnaround", "delivery", "shipping", "time", "how long"]
    },
    {
        "question": "Do you offer embroidery services?",
        "answer": "Yes! We offer professional embroidery on a variety of garments. Pricing is based on stitch count. Request a quote through our system with your design for accurate pricing.",
        "category": "services",
        "keywords": ["embroidery", "stitching", "embroidered", "patches"]
    },
    {
        "question": "What file formats do you accept for artwork?",
        "answer": "We accept vector formats (AI, EPS, PDF, SVG) and high-resolution raster files (PNG, PSD at 300+ DPI). Vector files ensure the best print quality.",
        "category": "technical",
        "keywords": ["file format", "artwork", "design file", "ai", "eps", "pdf", "png"]
    },
    {
        "question": "How do I track my order?",
        "answer": "Log into your customer portal at printshop-os.com/portal to view real-time order status. You'll receive email notifications at key milestones: Order Received, In Production, Quality Check, and Shipped.",
        "category": "order_status",
        "keywords": ["track", "order status", "where is my order", "tracking"]
    },
    {
        "question": "What is your minimum order quantity?",
        "answer": "We have no minimum order quantity! Whether you need 1 shirt or 1000, we're happy to help. Note that per-unit pricing decreases with volume.",
        "category": "pricing",
        "keywords": ["minimum", "moq", "how many", "quantity", "order size"]
    },
    {
        "question": "Can I get a sample before placing a full order?",
        "answer": "Yes! We offer sample production for a small fee. Order through our quote system and select 'Sample Order'. Samples typically ship within 3-5 business days.",
        "category": "samples",
        "keywords": ["sample", "test", "proof", "prototype"]
    },
    {
        "question": "What are your payment terms?",
        "answer": "We require 50% deposit on quote approval, with the remaining 50% due before shipping. We accept credit cards, ACH transfers, and can set up net-30 terms for established customers.",
        "category": "payment",
        "keywords": ["payment", "deposit", "pay", "invoice", "billing"]
    },
    {
        "question": "What if I'm not satisfied with my order?",
        "answer": "Your satisfaction is our priority! If there's a quality issue, contact us within 7 days of delivery. We'll review your concern and offer a reprint or refund as appropriate. See our quality guarantee policy for details.",
        "category": "returns",
        "keywords": ["refund", "return", "not happy", "quality issue", "complaint"]
    },
    {
        "question": "Do you ship internationally?",
        "answer": "Currently, we ship within the continental United States and Canada. International shipping may be arranged on a case-by-case basis. Contact us for international quotes.",
        "category": "shipping",
        "keywords": ["international", "ship to", "canada", "overseas", "export"]
    },
    {
        "question": "How do I request a bulk order quote?",
        "answer": "For bulk orders (100+ units), visit our quote tool and provide: quantity, garment type, colors, print locations. Our team will respond within 24 hours with competitive pricing.",
        "category": "pricing",
        "keywords": ["bulk", "wholesale", "large order", "quote", "pricing"]
    }
]

# Technical Knowledge Base
TECHNICAL_DOCS = [
    {
        "title": "Garment Care Instructions",
        "content": "All garments should be washed inside-out in cold water. Tumble dry low or hang dry. Do not iron directly on prints. For embroidered items, avoid bleach and harsh detergents.",
        "category": "care"
    },
    {
        "title": "Print Methods Comparison",
        "content": "Screen Printing: Best for large orders, vibrant colors, durable. DTG (Direct-to-Garment): Ideal for complex designs, small batches, photo-quality. Heat Transfer: Quick turnaround, works on various materials. Embroidery: Premium look, very durable, best for logos.",
        "category": "technical"
    },
    {
        "title": "Color Matching Guidelines",
        "content": "We use Pantone color matching for accuracy. Monitor colors may vary from printed results. Request a color swatch for critical color matches. CMYK converts to closest Pantone equivalent.",
        "category": "technical"
    }
]

def initialize_vector_db():
    """Initialize ChromaDB with knowledge base"""
    
    # Connect to ChromaDB
    client = chromadb.HttpClient(host="vector-db", port=8000)
    
    # Create embedding function
    embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Create or get collection
    collection = client.get_or_create_collection(
        name="customer_service_kb",
        embedding_function=embedding_fn,
        metadata={"description": "PrintShop OS Customer Service Knowledge Base"}
    )
    
    # Prepare documents for ingestion
    documents = []
    metadatas = []
    ids = []
    
    # Add FAQs
    for idx, faq in enumerate(FAQ_DATA):
        doc_text = f"Question: {faq['question']}\nAnswer: {faq['answer']}"
        documents.append(doc_text)
        metadatas.append({
            "type": "faq",
            "category": faq["category"],
            "keywords": ",".join(faq["keywords"])
        })
        ids.append(f"faq_{idx}")
    
    # Add technical docs
    for idx, doc in enumerate(TECHNICAL_DOCS):
        doc_text = f"Title: {doc['title']}\nContent: {doc['content']}"
        documents.append(doc_text)
        metadatas.append({
            "type": "technical_doc",
            "category": doc["category"],
            "title": doc["title"]
        })
        ids.append(f"tech_{idx}")
    
    # Ingest into vector database
    collection.add(
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    
    print(f"✅ Initialized knowledge base with {len(documents)} documents")
    print(f"   - FAQs: {len(FAQ_DATA)}")
    print(f"   - Technical Docs: {len(TECHNICAL_DOCS)}")
    
    return collection

if __name__ == "__main__":
    initialize_vector_db()
