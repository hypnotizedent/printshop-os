"""
Unit tests for LabelFormatter class.
"""

import pytest
import tempfile
from pathlib import Path
from PIL import Image
from printshop_os.labels import LabelFormatter


@pytest.fixture
def formatter():
    """Create a LabelFormatter instance."""
    return LabelFormatter()


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def sample_image(temp_dir):
    """Create a sample test image (simulating a shipping label)."""
    # Create a 1200x1800 image (4x6 inches at 300 DPI)
    img = Image.new('RGB', (1200, 1800), 'white')
    
    # Add some black content to simulate a label
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    draw.rectangle([100, 100, 1100, 1700], outline='black', width=5)
    draw.text((200, 200), "SAMPLE SHIPPING LABEL", fill='black')
    draw.rectangle([200, 400, 1000, 600], fill='black')  # Simulate barcode
    
    path = temp_dir / 'sample_label.png'
    img.save(path)
    return path


class TestLabelFormatter:
    """Test suite for LabelFormatter."""
    
    def test_initialization(self, formatter):
        """Test formatter initialization."""
        assert formatter.dpi == 300
        assert formatter.label_width_px == 1200
        assert formatter.label_height_px == 1800
    
    def test_initialization_custom_dpi(self):
        """Test formatter with custom DPI."""
        formatter = LabelFormatter(dpi=600)
        assert formatter.dpi == 600
        assert formatter.label_width_px == 2400
        assert formatter.label_height_px == 3600
    
    def test_load_image_png(self, formatter, sample_image):
        """Test loading a PNG image."""
        image = formatter._load_image(sample_image)
        assert image is not None
        assert image.mode == 'RGB'
        assert image.size == (1200, 1800)
    
    def test_load_image_nonexistent(self, formatter):
        """Test loading a non-existent file."""
        with pytest.raises(FileNotFoundError):
            formatter._load_image(Path('nonexistent.png'))
    
    def test_load_image_unsupported_format(self, formatter, temp_dir):
        """Test loading an unsupported file format."""
        test_file = temp_dir / 'test.txt'
        test_file.write_text('not an image')
        
        with pytest.raises(ValueError, match='Unsupported file format'):
            formatter._load_image(test_file)
    
    def test_auto_rotate_landscape_to_portrait(self, formatter):
        """Test auto-rotation of landscape image to portrait."""
        # Create landscape image (wider than tall)
        img = Image.new('RGB', (1800, 1200), 'white')
        rotated = formatter._auto_rotate(img)
        
        # Should be rotated to portrait
        assert rotated.width < rotated.height
    
    def test_auto_rotate_portrait_unchanged(self, formatter):
        """Test that portrait images are not rotated."""
        # Create portrait image
        img = Image.new('RGB', (1200, 1800), 'white')
        rotated = formatter._auto_rotate(img)
        
        # Should remain portrait
        assert rotated.width < rotated.height
        assert rotated.size == img.size
    
    def test_crop_to_label(self, formatter):
        """Test cropping to label boundaries."""
        # Create image with whitespace around content
        img = Image.new('RGB', (1500, 2000), 'white')
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([200, 200, 1300, 1800], fill='black')
        
        cropped = formatter._crop_to_label(img)
        
        # Cropped image should be smaller
        assert cropped.width < img.width
        assert cropped.height < img.height
    
    def test_resize_to_standard(self, formatter):
        """Test resizing to standard label dimensions."""
        # Create small image
        img = Image.new('RGB', (600, 900), 'white')
        resized = formatter._resize_to_standard(img)
        
        # Should be resized to standard 4x6
        assert resized.size == (formatter.label_width_px, formatter.label_height_px)
    
    def test_optimize_bw(self, formatter):
        """Test black & white optimization."""
        # Create color image
        img = Image.new('RGB', (1200, 1800), 'white')
        from PIL import ImageDraw
        draw = ImageDraw.Draw(img)
        draw.rectangle([100, 100, 1100, 1700], fill=(100, 100, 100))
        
        optimized = formatter._optimize_bw(img)
        
        # Should still be RGB but optimized
        assert optimized.mode == 'RGB'
        assert optimized.size == img.size
    
    def test_process_label_png_to_png(self, formatter, sample_image, temp_dir):
        """Test processing PNG to PNG."""
        output_path = temp_dir / 'output.png'
        
        result = formatter.process_label(
            input_path=sample_image,
            output_path=output_path,
            output_format='png'
        )
        
        assert result.exists()
        assert result == output_path
        
        # Verify output image
        output_img = Image.open(result)
        assert output_img.size == (formatter.label_width_px, formatter.label_height_px)
    
    def test_process_label_png_to_pdf(self, formatter, sample_image, temp_dir):
        """Test processing PNG to PDF."""
        output_path = temp_dir / 'output.pdf'
        
        result = formatter.process_label(
            input_path=sample_image,
            output_path=output_path,
            output_format='pdf'
        )
        
        assert result.exists()
        assert result.suffix == '.pdf'
    
    def test_process_label_with_options(self, formatter, sample_image, temp_dir):
        """Test processing with custom options."""
        output_path = temp_dir / 'output.png'
        
        result = formatter.process_label(
            input_path=sample_image,
            output_path=output_path,
            output_format='png',
            auto_rotate=False,
            optimize_bw=False
        )
        
        assert result.exists()
    
    def test_batch_process(self, formatter, temp_dir):
        """Test batch processing multiple files."""
        # Create input directory with multiple images
        input_dir = temp_dir / 'input'
        input_dir.mkdir()
        output_dir = temp_dir / 'output'
        
        # Create sample images
        for i in range(3):
            img = Image.new('RGB', (1200, 1800), 'white')
            img.save(input_dir / f'label_{i}.png')
        
        # Process batch
        processed = formatter.batch_process(
            input_dir=input_dir,
            output_dir=output_dir,
            output_format='pdf'
        )
        
        assert len(processed) == 3
        assert all(p.exists() for p in processed)
        assert all(p.suffix == '.pdf' for p in processed)
    
    def test_batch_process_with_pattern(self, formatter, temp_dir):
        """Test batch processing with file pattern."""
        input_dir = temp_dir / 'input'
        input_dir.mkdir()
        output_dir = temp_dir / 'output'
        
        # Create mixed files
        img = Image.new('RGB', (1200, 1800), 'white')
        img.save(input_dir / 'label_1.png')
        img.save(input_dir / 'label_2.jpg')
        (input_dir / 'readme.txt').write_text('test')
        
        # Process only PNG files
        processed = formatter.batch_process(
            input_dir=input_dir,
            output_dir=output_dir,
            output_format='pdf',
            pattern='*.png'
        )
        
        assert len(processed) == 1
        assert processed[0].stem == 'label_1'
