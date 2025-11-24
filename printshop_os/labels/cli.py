#!/usr/bin/env python3
"""
Command-line interface for the Label Formatter.

Usage:
    python -m printshop_os.labels.cli format input.pdf output.pdf
    python -m printshop_os.labels.cli batch input_dir/ output_dir/
"""

import argparse
import sys
from pathlib import Path
from .formatter import LabelFormatter


def format_command(args):
    """Format a single label file."""
    formatter = LabelFormatter(dpi=args.dpi)
    
    try:
        output_path = formatter.process_label(
            input_path=args.input,
            output_path=args.output,
            output_format=args.format,
            auto_rotate=not args.no_rotate,
            optimize_bw=not args.no_optimize
        )
        print(f"✓ Successfully formatted label: {output_path}")
        return 0
    except Exception as e:
        print(f"✗ Error: {str(e)}", file=sys.stderr)
        return 1


def batch_command(args):
    """Batch process multiple label files."""
    formatter = LabelFormatter(dpi=args.dpi)
    
    try:
        processed = formatter.batch_process(
            input_dir=args.input_dir,
            output_dir=args.output_dir,
            output_format=args.format,
            pattern=args.pattern
        )
        print(f"\n✓ Successfully processed {len(processed)} labels")
        return 0
    except Exception as e:
        print(f"✗ Error: {str(e)}", file=sys.stderr)
        return 1


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="PrintShop OS Label Formatter - Automatically format shipping labels for thermal printing",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Format a single label
  python -m printshop_os.labels.cli format input.pdf output.pdf
  
  # Format with specific options
  python -m printshop_os.labels.cli format input.pdf output.png --format png --no-rotate
  
  # Batch process a directory
  python -m printshop_os.labels.cli batch labels/ formatted_labels/
  
  # Batch process with pattern
  python -m printshop_os.labels.cli batch labels/ formatted/ --pattern "*.pdf"
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    subparsers.required = True
    
    # Format command
    format_parser = subparsers.add_parser('format', help='Format a single label')
    format_parser.add_argument('input', type=str, help='Input file path (PDF or image)')
    format_parser.add_argument('output', type=str, help='Output file path')
    format_parser.add_argument(
        '--format', '-f',
        choices=['pdf', 'png'],
        default='pdf',
        help='Output format (default: pdf)'
    )
    format_parser.add_argument(
        '--dpi',
        type=int,
        default=300,
        help='Output resolution in DPI (default: 300)'
    )
    format_parser.add_argument(
        '--no-rotate',
        action='store_true',
        help='Disable automatic rotation'
    )
    format_parser.add_argument(
        '--no-optimize',
        action='store_true',
        help='Disable black & white optimization'
    )
    format_parser.set_defaults(func=format_command)
    
    # Batch command
    batch_parser = subparsers.add_parser('batch', help='Batch process multiple labels')
    batch_parser.add_argument('input_dir', type=str, help='Input directory')
    batch_parser.add_argument('output_dir', type=str, help='Output directory')
    batch_parser.add_argument(
        '--format', '-f',
        choices=['pdf', 'png'],
        default='pdf',
        help='Output format (default: pdf)'
    )
    batch_parser.add_argument(
        '--pattern', '-p',
        type=str,
        default='*',
        help='File pattern to match (default: *)'
    )
    batch_parser.add_argument(
        '--dpi',
        type=int,
        default=300,
        help='Output resolution in DPI (default: 300)'
    )
    batch_parser.set_defaults(func=batch_command)
    
    # Parse and execute
    args = parser.parse_args()
    sys.exit(args.func(args))


if __name__ == '__main__':
    main()
