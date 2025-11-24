#!/usr/bin/env python3
"""
Email Ingestion Script for PrintShop OS
Parses .mbox files from Exchange/Gmail and converts them into training data.
"""
import mailbox
import os
import email
from email.header import decode_header
from datetime import datetime
import re

# Configuration
INPUT_DIR = "data/raw/email-exports"
OUTPUT_DIR = "data/intelligence/knowledge_base/email_history"

def decode_str(s):
    """Decode email header strings"""
    if not s:
        return ""
    decoded_list = decode_header(s)
    result = ""
    for content, encoding in decoded_list:
        if isinstance(content, bytes):
            if encoding:
                try:
                    result += content.decode(encoding)
                except:
                    result += content.decode('utf-8', errors='ignore')
            else:
                result += content.decode('utf-8', errors='ignore')
        else:
            result += str(content)
    return result

def get_body(message):
    """Extract plain text body from email"""
    body = ""
    if message.is_multipart():
        for part in message.walk():
            ctype = part.get_content_type()
            cdispo = str(part.get('Content-Disposition'))
            
            if ctype == 'text/plain' and 'attachment' not in cdispo:
                try:
                    body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                    break
                except:
                    pass
    else:
        try:
            body = message.get_payload(decode=True).decode('utf-8', errors='ignore')
        except:
            pass
    return body

def clean_body(body):
    """Remove signatures, replies, and clutter"""
    # Simple heuristic to remove "On ... wrote:" blocks
    lines = body.split('\n')
    clean_lines = []
    for line in lines:
        if line.strip().startswith('>'):
            continue
        if re.search(r'On .* wrote:', line):
            break
        if re.search(r'From:.*Sent:.*To:.*Subject:', line):
            break
        clean_lines.append(line)
    return '\n'.join(clean_lines).strip()

def process_mailbox(mbox_path):
    """Process a single .mbox file"""
    print(f"📂 Reading {mbox_path}...")
    mbox = mailbox.mbox(mbox_path)
    
    count = 0
    for message in mbox:
        subject = decode_str(message['subject'])
        sender = decode_str(message['from'])
        date = message['date']
        
        # Filter out noise (Bank alerts, Newsletters, etc.)
        # Add your own filters here
        if "no-reply" in sender or "alert" in subject.lower():
            continue
            
        body = get_body(message)
        clean_text = clean_body(body)
        
        if len(clean_text) < 50:  # Skip empty/short emails
            continue
            
        # Create a filename safe string
        safe_subject = "".join([c for c in subject if c.isalnum() or c in (' ', '-', '_')]).strip()
        safe_subject = safe_subject[:50].replace(" ", "_")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{safe_subject}.md"
        
        output_path = os.path.join(OUTPUT_DIR, filename)
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"# Email: {subject}\n")
            f.write(f"**From:** {sender}\n")
            f.write(f"**Date:** {date}\n\n")
            f.write("## Content\n")
            f.write(clean_text)
            f.write("\n\n## Analysis (Auto-Generated)\n")
            f.write("<!-- LLM to fill this in later -->\n")
            
        count += 1
        if count % 10 == 0:
            print(f"   Processed {count} emails...")

    print(f"✅ Finished! Processed {count} emails from {mbox_path}")

def main():
    # Ensure directories exist
    if not os.path.exists(INPUT_DIR):
        os.makedirs(INPUT_DIR)
        print(f"⚠️ Created input directory: {INPUT_DIR}")
        print("   -> Please drop your .mbox files here!")
        return

    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # Find .mbox files
    files = [f for f in os.listdir(INPUT_DIR) if f.endswith('.mbox')]
    
    if not files:
        print(f"⚠️ No .mbox files found in {INPUT_DIR}")
        return

    for f in files:
        process_mailbox(os.path.join(INPUT_DIR, f))

if __name__ == "__main__":
    main()
