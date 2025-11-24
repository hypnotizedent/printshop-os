#!/usr/bin/env python3
"""
Label Formatter Demo

Demonstrates how to use the PrintShop OS Label Formatter to automatically
format shipping labels for thermal printing.
"""

import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from printshop_os.labels import LabelFormatter


def create_sample_label(output_path: Path):
    """Create a sample shipping label for demonstration."""
    # Create a landscape image (simulating a downloaded label)
    img = Image.new('RGB', (2400, 1650), 'white')
    draw = ImageDraw.Draw(img)
    
    # Border
    draw.rectangle([50, 50, 2350, 1600], outline='black', width=10)
    
    # Title area
    draw.rectangle([100, 100, 2300, 300], outline='black', width=3)
    draw.text((120, 150), "UPS GROUND SHIPPING LABEL", fill='black')
    
    # From/To sections
    draw.rectangle([100, 350, 1150, 800], outline='black', width=2)
    draw.text((120, 370), "FROM:", fill='black')
    draw.text((120, 420), "Print Shop Inc.", fill='black')
    draw.text((120, 470), "123 Main Street", fill='black')
    draw.text((120, 520), "City, ST 12345", fill='black')
    
    draw.rectangle([1200, 350, 2300, 800], outline='black', width=2)
    draw.text((1220, 370), "TO:", fill='black')
    draw.text((1220, 420), "Customer Name", fill='black')
    draw.text((1220, 470), "456 Oak Avenue", fill='black')
    draw.text((1220, 520), "Town, ST 67890", fill='black')
    
    # Tracking number
    draw.rectangle([100, 850, 2300, 1050], outline='black', width=3)
    draw.text((120, 900), "TRACKING: 1ZXA28250390330829", fill='black')
    
    # Barcode simulation
    draw.rectangle([100, 1100, 2300, 1500], fill='black')
    for i in range(0, 2200, 20):
        draw.rectangle([100 + i, 1100, 110 + i, 1500], fill='white')
    
    img.save(output_path)
    print(f"✓ Created sample label: {output_path}")
    return img


def main():
    """Run the demonstration."""
    print("=" * 70)
    print("PrintShop OS - Label Formatter Demo")
    print("=" * 70)
    print()
    
    # Create temporary directory for demo files
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        print("📝 Step 1: Creating sample shipping label...")
        sample_label = tmpdir / "sample_label.png"
        create_sample_label(sample_label)
        
        # Display original dimensions
        orig_img = Image.open(sample_label)
        print(f"   Original size: {orig_img.size[0]}x{orig_img.size[1]} pixels")
        print(f"   Orientation: {'Landscape' if orig_img.width > orig_img.height else 'Portrait'}")
        print()
        
        print("🔄 Step 2: Initializing Label Formatter...")
        formatter = LabelFormatter(dpi=300)
        print(f"   Target size: {formatter.label_width_px}x{formatter.label_height_px} pixels")
        print(f"   Target dimensions: {formatter.LABEL_WIDTH_INCHES}x{formatter.LABEL_HEIGHT_INCHES} inches")
        print()
        
        print("⚙️  Step 3: Processing label...")
        print("   - Auto-rotating from landscape to portrait")
        print("   - Cropping whitespace")
        print("   - Resizing to 4x6 inches")
        print("   - Optimizing for B&W thermal printing")
        
        # Process to PDF
        output_pdf = tmpdir / "formatted_label.pdf"
        formatter.process_label(
            input_path=sample_label,
            output_path=output_pdf,
            output_format='pdf',
            auto_rotate=True,
            optimize_bw=True
        )
        print(f"   ✓ Created formatted PDF: {output_pdf}")
        
        # Process to PNG
        output_png = tmpdir / "formatted_label.png"
        formatter.process_label(
            input_path=sample_label,
            output_path=output_png,
            output_format='png',
            auto_rotate=True,
            optimize_bw=True
        )
        print(f"   ✓ Created formatted PNG: {output_png}")
        print()
        
        # Verify output
        output_img = Image.open(output_png)
        print("✅ Step 4: Verification")
        print(f"   Output size: {output_img.size[0]}x{output_img.size[1]} pixels")
        print(f"   Orientation: {'Landscape' if output_img.width > output_img.height else 'Portrait'}")
        print(f"   Format: {output_pdf.suffix}")
        print()
        
        print("=" * 70)
        print("Demo Complete!")
        print("=" * 70)
        print()
        print("Next Steps:")
        print("  1. Use the CLI tool:")
        print("     python -m printshop_os.labels.cli format input.pdf output.pdf")
        print()
        print("  2. Start the API server:")
        print("     python -m printshop_os.labels.api")
        print()
        print("  3. Integrate with your frontend:")
        print("     POST /api/labels/format with file upload")
        print()
        print("For more information, see:")
        print("  - printshop_os/README.md")
        print("  - docs/label-formatter-guide.md (coming soon)")
        print()


if __name__ == '__main__':
    main()
