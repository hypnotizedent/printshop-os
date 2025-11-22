"""
Tests for EasyPost Client

Note: These tests require a valid EasyPost API key to run.
Set EASYPOST_API_KEY environment variable to run integration tests.
Without the API key, only basic initialization tests will run.
"""

import os
import unittest
from unittest.mock import Mock, patch, MagicMock
from printshop_os.shipping.easypost_client import EasyPostClient


class TestEasyPostClientInitialization(unittest.TestCase):
    """Test EasyPost client initialization and configuration."""
    
    def test_init_with_api_key(self):
        """Test client initialization with API key provided."""
        with patch('easypost.EasyPostClient'):
            client = EasyPostClient(api_key="test_key_123")
            self.assertEqual(client.api_key, "test_key_123")
            self.assertEqual(client.mode, "test")
    
    def test_init_with_environment_variable(self):
        """Test client initialization with API key from environment."""
        with patch.dict(os.environ, {"EASYPOST_API_KEY": "env_key_456"}):
            with patch('easypost.EasyPostClient'):
                client = EasyPostClient()
                self.assertEqual(client.api_key, "env_key_456")
    
    def test_init_without_api_key_raises_error(self):
        """Test that initialization without API key raises ValueError."""
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as context:
                EasyPostClient()
            self.assertIn("API key is required", str(context.exception))
    
    def test_init_with_custom_mode(self):
        """Test client initialization with custom mode."""
        with patch('easypost.EasyPostClient'):
            client = EasyPostClient(api_key="test_key", mode="production")
            self.assertEqual(client.mode, "production")
    
    def test_init_with_mode_from_environment(self):
        """Test mode initialization from environment variable."""
        with patch.dict(os.environ, {"EASYPOST_MODE": "production"}):
            with patch('easypost.EasyPostClient'):
                client = EasyPostClient(api_key="test_key")
                self.assertEqual(client.mode, "production")


class TestEasyPostClientMethods(unittest.TestCase):
    """Test EasyPost client methods with mocked API."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_easypost_client = MagicMock()
        with patch('easypost.EasyPostClient', return_value=self.mock_easypost_client):
            self.client = EasyPostClient(api_key="test_key_123")
    
    def test_create_shipment(self):
        """Test shipment creation."""
        # Mock shipment object
        mock_shipment = Mock()
        mock_shipment.id = "shp_test123"
        mock_shipment.tracking_code = "TRACK123"
        mock_shipment.status = "created"
        mock_shipment.created_at = "2023-01-01T00:00:00Z"
        mock_shipment.updated_at = "2023-01-01T00:00:00Z"
        mock_shipment.rates = []
        mock_shipment.postage_label = None
        mock_shipment.selected_rate = None
        
        self.mock_easypost_client.shipment.create.return_value = mock_shipment
        
        from_addr = {
            "name": "PrintShop OS",
            "street1": "123 Main St",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94105",
            "country": "US"
        }
        to_addr = {
            "name": "John Doe",
            "street1": "456 Market St",
            "city": "Los Angeles",
            "state": "CA",
            "zip": "90001",
            "country": "US"
        }
        parcel = {
            "length": 10,
            "width": 8,
            "height": 4,
            "weight": 15.5
        }
        
        result = self.client.create_shipment(from_addr, to_addr, parcel)
        
        self.assertEqual(result["id"], "shp_test123")
        self.assertEqual(result["tracking_code"], "TRACK123")
        self.mock_easypost_client.shipment.create.assert_called_once()
    
    def test_get_label_url(self):
        """Test retrieving label URL."""
        mock_shipment = Mock()
        mock_label = Mock()
        mock_label.label_url = "https://easypost.com/label/test123.pdf"
        mock_shipment.postage_label = mock_label
        
        self.mock_easypost_client.shipment.retrieve.return_value = mock_shipment
        
        url = self.client.get_label_url("shp_test123")
        
        self.assertEqual(url, "https://easypost.com/label/test123.pdf")
        self.mock_easypost_client.shipment.retrieve.assert_called_once_with("shp_test123")
    
    def test_get_label_url_no_label(self):
        """Test retrieving label URL when no label exists."""
        mock_shipment = Mock()
        mock_shipment.postage_label = None
        
        self.mock_easypost_client.shipment.retrieve.return_value = mock_shipment
        
        url = self.client.get_label_url("shp_test123")
        
        self.assertIsNone(url)
    
    def test_list_rates(self):
        """Test listing available rates."""
        mock_rate1 = Mock()
        mock_rate1.id = "rate_1"
        mock_rate1.carrier = "USPS"
        mock_rate1.service = "Priority"
        mock_rate1.rate = "7.50"
        mock_rate1.currency = "USD"
        mock_rate1.delivery_days = 2
        mock_rate1.delivery_date = None
        mock_rate1.delivery_date_guaranteed = False
        
        mock_rate2 = Mock()
        mock_rate2.id = "rate_2"
        mock_rate2.carrier = "UPS"
        mock_rate2.service = "Ground"
        mock_rate2.rate = "9.25"
        mock_rate2.currency = "USD"
        mock_rate2.delivery_days = 3
        mock_rate2.delivery_date = None
        mock_rate2.delivery_date_guaranteed = False
        
        mock_shipment = Mock()
        mock_shipment.rates = [mock_rate1, mock_rate2]
        
        self.mock_easypost_client.shipment.retrieve.return_value = mock_shipment
        
        rates = self.client.list_rates("shp_test123")
        
        self.assertEqual(len(rates), 2)
        self.assertEqual(rates[0]["carrier"], "USPS")
        self.assertEqual(rates[1]["carrier"], "UPS")


class TestEasyPostClientAddressValidation(unittest.TestCase):
    """Test address validation functionality."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.mock_easypost_client = MagicMock()
        with patch('easypost.EasyPostClient', return_value=self.mock_easypost_client):
            self.client = EasyPostClient(api_key="test_key_123")
    
    def test_validate_address_success(self):
        """Test successful address validation."""
        mock_address = Mock()
        mock_address.street1 = "123 Main St"
        mock_address.street2 = None
        mock_address.city = "San Francisco"
        mock_address.state = "CA"
        mock_address.zip = "94105"
        mock_address.country = "US"
        
        self.mock_easypost_client.address.create_and_verify.return_value = mock_address
        
        address = {
            "street1": "123 Main St",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94105",
            "country": "US"
        }
        
        result = self.client.validate_address(address)
        
        self.assertTrue(result["valid"])
        self.assertEqual(result["address"]["city"], "San Francisco")
        self.assertEqual(len(result["errors"]), 0)


if __name__ == "__main__":
    unittest.main()
