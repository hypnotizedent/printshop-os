"""
Unit tests for PrintavoAPI module.
"""

import pytest
from pathlib import Path
import tempfile
import json
import sys

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'scripts'))

from lib.printavo_api import PrintavoAPI, APIStats


class TestAPIStats:
    """Test APIStats dataclass."""
    
    def test_default_values(self):
        """Test default values."""
        stats = APIStats()
        assert stats.requests == 0
        assert stats.errors == []
        assert stats.rate_limited == 0
    
    def test_increment(self):
        """Test incrementing stats."""
        stats = APIStats()
        stats.requests += 1
        stats.rate_limited += 1
        assert stats.requests == 1
        assert stats.rate_limited == 1


class TestPrintavoAPIInit:
    """Test PrintavoAPI initialization."""
    
    def test_init_without_credentials(self):
        """Test initialization without credentials raises error."""
        import os
        # Clear environment variables
        old_email = os.environ.pop('PRINTAVO_EMAIL', None)
        old_token = os.environ.pop('PRINTAVO_TOKEN', None)
        
        try:
            with pytest.raises(ValueError):
                PrintavoAPI(email='', token='')
        finally:
            # Restore environment
            if old_email:
                os.environ['PRINTAVO_EMAIL'] = old_email
            if old_token:
                os.environ['PRINTAVO_TOKEN'] = old_token
    
    def test_init_with_credentials(self):
        """Test initialization with credentials."""
        api = PrintavoAPI(
            email='test@example.com',
            token='test_token'
        )
        assert api.email == 'test@example.com'
        assert api.token == 'test_token'
    
    def test_init_with_checkpoint_file(self):
        """Test initialization with checkpoint file."""
        with tempfile.NamedTemporaryFile(
            mode='w', 
            suffix='.json', 
            delete=False
        ) as f:
            json.dump({'last_page': 5}, f)
            checkpoint_path = Path(f.name)
        
        try:
            api = PrintavoAPI(
                email='test@example.com',
                token='test_token',
                checkpoint_file=checkpoint_path
            )
            assert api._checkpoint.get('last_page') == 5
        finally:
            checkpoint_path.unlink()


class TestPrintavoAPICheckpoint:
    """Test checkpoint functionality."""
    
    def test_save_and_load_checkpoint(self):
        """Test saving and loading checkpoint."""
        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.json',
            delete=False
        ) as f:
            checkpoint_path = Path(f.name)
        
        try:
            api = PrintavoAPI(
                email='test@example.com',
                token='test_token',
                checkpoint_file=checkpoint_path
            )
            
            # Save checkpoint
            api._save_checkpoint('test_key', 'test_value')
            
            # Reload and verify
            with open(checkpoint_path) as f:
                data = json.load(f)
            
            assert data['test_key'] == 'test_value'
            assert 'updated_at' in data
        finally:
            checkpoint_path.unlink()


class TestPrintavoAPIHelpers:
    """Test helper methods."""
    
    def test_extract_line_items_from_orders(self):
        """Test extracting line items from orders."""
        api = PrintavoAPI(
            email='test@example.com',
            token='test_token'
        )
        
        orders = [
            {
                'id': 1,
                'visual_id': 'INV-001',
                'lineitems_attributes': [
                    {'id': 101, 'style_number': 'G200'},
                    {'id': 102, 'style_number': 'PC54'},
                ]
            },
            {
                'id': 2,
                'visual_id': 'INV-002',
                'lineitems_attributes': [
                    {'id': 201, 'style_number': 'G500'},
                ]
            }
        ]
        
        line_items = api.extract_line_items_from_orders(orders)
        
        assert len(line_items) == 3
        assert line_items[0]['order_id'] == 1
        assert line_items[0]['order_visual_id'] == 'INV-001'
        assert line_items[2]['order_id'] == 2
    
    def test_extract_line_items_empty_orders(self):
        """Test extracting line items from empty orders list."""
        api = PrintavoAPI(
            email='test@example.com',
            token='test_token'
        )
        
        line_items = api.extract_line_items_from_orders([])
        assert line_items == []
    
    def test_extract_line_items_no_lineitems(self):
        """Test extracting from orders without line items."""
        api = PrintavoAPI(
            email='test@example.com',
            token='test_token'
        )
        
        orders = [{'id': 1, 'visual_id': 'INV-001'}]
        line_items = api.extract_line_items_from_orders(orders)
        assert line_items == []
    
    def test_get_stats(self):
        """Test getting API stats."""
        api = PrintavoAPI(
            email='test@example.com',
            token='test_token'
        )
        
        api.stats.requests = 100
        api.stats.rate_limited = 5
        api.stats.errors = ['error1', 'error2']
        
        stats = api.get_stats()
        
        assert stats['requests'] == 100
        assert stats['rate_limited'] == 5
        assert stats['errors'] == 2
        assert len(stats['error_messages']) == 2


class TestPrintavoAPIConfiguration:
    """Test API configuration."""
    
    def test_base_url(self):
        """Test base URL is correct."""
        assert PrintavoAPI.BASE_URL == 'https://www.printavo.com/api/v1'
    
    def test_request_delay(self):
        """Test request delay is set."""
        assert PrintavoAPI.REQUEST_DELAY == 0.6
    
    def test_max_retries(self):
        """Test max retries is set."""
        assert PrintavoAPI.MAX_RETRIES == 3
