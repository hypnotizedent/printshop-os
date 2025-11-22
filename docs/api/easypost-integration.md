# EasyPost Shipping Integration

## Overview

The EasyPost integration enables PrintShop OS to create, manage, and purchase shipping labels directly within the platform. This integration streamlines the shipping workflow for orders by automating label creation and providing tracking capabilities.

## Features

- **Shipment Creation**: Create shipments with sender and recipient addresses
- **Rate Comparison**: Get and compare shipping rates from multiple carriers
- **Label Purchase**: Purchase shipping labels and download them as PDF
- **Address Validation**: Validate and correct shipping addresses
- **Package Tracking**: Track shipments using tracking codes
- **Multi-carrier Support**: Support for USPS, UPS, FedEx, and more

## Setup and Configuration

### 1. Install Dependencies

Install the required Python dependencies:

```bash
pip install -r requirements.txt
```

This will install the `easypost` Python library (version 9.0.0 or higher).

### 2. Get EasyPost API Key

1. Sign up for an EasyPost account at [https://www.easypost.com](https://www.easypost.com)
2. Navigate to your account settings: [https://www.easypost.com/account/api-keys](https://www.easypost.com/account/api-keys)
3. Copy your API key (use Test API key for development)

### 3. Configure Environment Variables

Add your EasyPost API credentials to the `.env` file:

```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials
EASYPOST_API_KEY=your_actual_api_key_here
EASYPOST_MODE=test  # Use 'test' for development, 'production' for live shipments
```

**Important**: Never commit your `.env` file to version control. The `.gitignore` file is already configured to exclude it.

## Usage

### Basic Usage

```python
from printshop_os.shipping import EasyPostClient

# Initialize the client (reads API key from environment)
client = EasyPostClient()

# Or initialize with explicit API key
client = EasyPostClient(api_key="your_api_key", mode="test")
```

### Creating a Shipment

```python
# Define addresses
from_address = {
    "name": "PrintShop OS",
    "street1": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US",
    "phone": "555-0100"  # Optional but recommended
}

to_address = {
    "name": "John Doe",
    "company": "Acme Corp",  # Optional
    "street1": "456 Market Street",
    "street2": "Suite 200",  # Optional
    "city": "Los Angeles",
    "state": "CA",
    "zip": "90001",
    "country": "US",
    "phone": "555-0200"  # Optional but recommended
}

# Define package dimensions (in inches and ounces)
parcel = {
    "length": 10,   # inches
    "width": 8,     # inches
    "height": 4,    # inches
    "weight": 15.5  # ounces
}

# Create shipment
shipment = client.create_shipment(from_address, to_address, parcel)
print(f"Shipment created: {shipment['id']}")
```

### Comparing Shipping Rates

```python
# Get all available rates for a shipment
rates = client.list_rates(shipment['id'])

# Display rates
for rate in rates:
    print(f"{rate['carrier']} {rate['service']}: ${rate['rate']} ({rate['delivery_days']} days)")

# Example output:
# USPS Priority: $7.50 (2 days)
# USPS First: $5.25 (3 days)
# UPS Ground: $9.25 (3 days)
```

### Purchasing a Shipping Label

```python
# Buy shipment with lowest rate (automatic)
label = client.buy_shipment(shipment['id'])

# Or buy with specific rate
label = client.buy_shipment(shipment['id'], rate_id=rates[0]['id'])

# Get label URL
label_url = client.get_label_url(shipment['id'])
print(f"Download label: {label_url}")

# Download and save the label
import requests
response = requests.get(label_url)
with open('shipping_label.pdf', 'wb') as f:
    f.write(response.content)
```

### Validating Addresses

```python
# Validate an address before creating shipment
address = {
    "street1": "123 Main St",
    "city": "San Francisco",
    "state": "CA",
    "zip": "94105",
    "country": "US"
}

result = client.validate_address(address)

if result['valid']:
    print("Address is valid!")
    print(f"Corrected address: {result['address']}")
else:
    print(f"Address validation failed: {result['errors']}")
```

### Tracking Shipments

```python
# Track a shipment using tracking code
tracking_code = "9400111899562539802544"
tracking_info = client.track_shipment(tracking_code)

print(f"Status: {tracking_info['status']}")
print(f"Status Detail: {tracking_info['status_detail']}")
print(f"Est. Delivery: {tracking_info['est_delivery_date']}")

# Show tracking history
for detail in tracking_info['tracking_details']:
    print(f"{detail['datetime']}: {detail['message']}")
```

## Integration with PrintShop OS

### Workflow Integration

The typical workflow for shipping an order:

1. **Order Completion**: When a print job is completed, retrieve order details from Strapi
2. **Create Shipment**: Use customer and order information to create an EasyPost shipment
3. **Rate Selection**: Display available rates to staff or automatically select lowest rate
4. **Purchase Label**: Buy the shipping label
5. **Download Label**: Save and print the label for package
6. **Update Order**: Store tracking code in Strapi order record
7. **Customer Notification**: Send tracking code to customer via email/SMS

### Example: Complete Shipping Flow

```python
from printshop_os.shipping import EasyPostClient
import requests

def ship_order(order_id):
    """Ship a completed order."""
    # Initialize EasyPost client
    easypost = EasyPostClient()
    
    # 1. Get order details from Strapi API
    order = requests.get(f"http://localhost:1337/api/orders/{order_id}").json()
    
    # 2. Prepare addresses
    from_address = {
        "name": "PrintShop OS",
        "street1": "Your Shop Address",
        "city": "Your City",
        "state": "CA",
        "zip": "12345",
        "country": "US"
    }
    
    to_address = {
        "name": order['customer']['name'],
        "street1": order['shipping_address']['street1'],
        "city": order['shipping_address']['city'],
        "state": order['shipping_address']['state'],
        "zip": order['shipping_address']['zip'],
        "country": "US"
    }
    
    # 3. Create shipment
    parcel = {
        "length": 12,
        "width": 10,
        "height": 4,
        "weight": 16  # Calculate based on order
    }
    
    shipment = easypost.create_shipment(from_address, to_address, parcel)
    
    # 4. Buy label (use lowest rate)
    label = easypost.buy_shipment(shipment['id'])
    
    # 5. Download label
    label_url = label['postage_label']['label_url']
    response = requests.get(label_url)
    label_path = f"/tmp/label_{order_id}.pdf"
    with open(label_path, 'wb') as f:
        f.write(response.content)
    
    # 6. Update order in Strapi
    tracking_code = label['tracking_code']
    requests.put(
        f"http://localhost:1337/api/orders/{order_id}",
        json={
            "tracking_code": tracking_code,
            "status": "shipped",
            "label_url": label_url
        }
    )
    
    return {
        "tracking_code": tracking_code,
        "label_path": label_path,
        "label_url": label_url
    }
```

## API Reference

### EasyPostClient Class

#### `__init__(api_key=None, mode="test")`

Initialize the EasyPost client.

**Parameters:**
- `api_key` (str, optional): EasyPost API key. Reads from `EASYPOST_API_KEY` env var if not provided.
- `mode` (str, optional): Operation mode - 'test' or 'production'. Default: 'test'.

#### `create_shipment(from_address, to_address, parcel, **kwargs)`

Create a new shipment.

**Parameters:**
- `from_address` (dict): Sender address information
- `to_address` (dict): Recipient address information  
- `parcel` (dict): Package dimensions (length, width, height, weight)
- `**kwargs`: Additional options (customs_info, insurance, etc.)

**Returns:** dict with shipment details including ID and available rates

#### `buy_shipment(shipment_id, rate_id=None)`

Purchase a shipping label for a shipment.

**Parameters:**
- `shipment_id` (str): The shipment ID
- `rate_id` (str, optional): Specific rate to purchase. Uses lowest rate if not provided.

**Returns:** dict with label URL and tracking information

#### `get_label_url(shipment_id)`

Get the URL for a purchased shipping label.

**Parameters:**
- `shipment_id` (str): The shipment ID

**Returns:** str URL to download label, or None if not purchased

#### `list_rates(shipment_id)`

Get available shipping rates for a shipment.

**Parameters:**
- `shipment_id` (str): The shipment ID

**Returns:** list of rate dictionaries

#### `track_shipment(tracking_code)`

Get tracking information for a shipment.

**Parameters:**
- `tracking_code` (str): The tracking code

**Returns:** dict with tracking status and history

#### `validate_address(address)`

Validate a shipping address.

**Parameters:**
- `address` (dict): Address to validate

**Returns:** dict with validation result and corrected address

## Testing

### Running Unit Tests

```bash
# Run all tests
python -m pytest tests/

# Run shipping tests only
python -m pytest tests/shipping/

# Run with coverage
python -m pytest --cov=printshop_os tests/
```

### Manual Testing in Development

Create a test script to verify the integration:

```python
# test_easypost.py
from printshop_os.shipping import EasyPostClient

def test_basic_flow():
    client = EasyPostClient()  # Uses test API key from .env
    
    # Use EasyPost test addresses
    from_addr = {
        "name": "Test Sender",
        "street1": "417 Montgomery Street",
        "street2": "Floor 5",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94104",
        "country": "US"
    }
    
    to_addr = {
        "name": "Test Recipient",
        "street1": "179 N Harbor Dr",
        "city": "Redondo Beach",
        "state": "CA",
        "zip": "90277",
        "country": "US"
    }
    
    parcel = {"length": 10, "width": 8, "height": 4, "weight": 15}
    
    # Create shipment
    shipment = client.create_shipment(from_addr, to_addr, parcel)
    print(f"✓ Shipment created: {shipment['id']}")
    
    # List rates
    rates = client.list_rates(shipment['id'])
    print(f"✓ Found {len(rates)} rates")
    for rate in rates:
        print(f"  - {rate['carrier']} {rate['service']}: ${rate['rate']}")
    
    print("\n✓ All tests passed!")

if __name__ == "__main__":
    test_basic_flow()
```

Run the test:
```bash
python test_easypost.py
```

## Security Best Practices

1. **Never commit API keys**: Always use environment variables
2. **Use test mode in development**: Set `EASYPOST_MODE=test` for development
3. **Validate user input**: Always validate addresses before creating shipments
4. **Handle errors gracefully**: Wrap API calls in try-except blocks
5. **Limit production access**: Only authorize necessary personnel to production API keys

## Troubleshooting

### Common Issues

**"API key is required" Error**
- Ensure `EASYPOST_API_KEY` is set in your `.env` file
- Verify the `.env` file is in the project root
- Check that the API key is valid and not expired

**"Address validation failed" Error**
- Verify all required address fields are provided
- Ensure ZIP codes match city/state combinations
- Use standard address formats (e.g., "Street" not "St")

**"No rates available" Error**
- Check that addresses are in serviceable areas
- Verify package dimensions are reasonable
- Ensure weight is in ounces (not pounds)

**Rate limits exceeded**
- EasyPost test accounts have rate limits
- Add delays between API calls in batch operations
- Consider upgrading to production account for higher limits

## Resources

- [EasyPost Python Library Documentation](https://github.com/EasyPost/easypost-python)
- [EasyPost API Documentation](https://www.easypost.com/docs/api)
- [EasyPost Test Mode Guide](https://www.easypost.com/docs/api#test-mode)
- [EasyPost Supported Carriers](https://www.easypost.com/carriers)

## Support

For issues with the EasyPost integration:
1. Check the troubleshooting section above
2. Review EasyPost API documentation
3. Open an issue on the PrintShop OS GitHub repository
4. Contact EasyPost support for API-specific issues
