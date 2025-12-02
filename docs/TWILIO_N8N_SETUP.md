# Twilio & n8n Notification Setup Guide

This guide covers the setup and configuration of the multi-channel notification system for PrintShop OS, including Twilio (SMS) and n8n (workflow automation).

## Overview

PrintShop OS uses a multi-channel notification system to keep customers informed about their order status:

- **Email**: All order status updates (via SendGrid or n8n)
- **SMS**: Pickup and shipping notifications only (via Twilio)
- **n8n**: Workflow automation for orchestrating notifications

### Strategic Timing

| Event Type | Email | SMS |
|------------|-------|-----|
| Payment Received | ✅ | ❌ |
| Garments Arrived | ✅ | ❌ |
| Artwork Ready | ✅ | ❌ |
| In Production | ✅ | ❌ |
| Quality Check | ✅ | ❌ |
| Ready for Pickup | ✅ | ✅ |
| Shipped | ✅ | ✅ |

---

## 1. Environment Variables

Add the following to your `.env` file:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=AC_your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# n8n Configuration
N8N_WEBHOOK_URL=http://your-n8n-host:5678/webhook
N8N_WEBHOOK_SECRET=your_webhook_secret

# Enable/Disable Notifications
NOTIFICATIONS_ENABLED=true

# API Service URL (for Strapi lifecycle hooks)
API_SERVICE_URL=http://localhost:3002
```

---

## 2. Twilio Setup

### Step 1: Create a Twilio Account

1. Sign up at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Verify your phone number
3. Complete the account setup wizard

### Step 2: Get Your Credentials

1. Go to **Console Dashboard**
2. Copy your **Account SID** and **Auth Token**
3. Store them securely in your `.env` file

### Step 3: Get a Phone Number

1. Navigate to **Phone Numbers** > **Manage** > **Buy a number**
2. Search for a number with SMS capability
3. Purchase the number
4. Copy the number (in E.164 format, e.g., `+15551234567`)

### Step 4: Configure Messaging

For production, configure:
- **Messaging Service** (optional but recommended for high volume)
- **Opt-out handling** for compliance
- **Webhook URLs** for delivery status

### Phone Number Format

PrintShop OS uses E.164 format for phone numbers:
- US: `+15551234567`
- UK: `+447911123456`
- AU: `+61412345678`

---

## 3. n8n Setup (Docker)

### Docker Compose Configuration

Add to your `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    container_name: printshop-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=your_secure_password
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://your-domain:5678
      - GENERIC_TIMEZONE=America/Chicago
      - TZ=America/Chicago
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - printshop-network

volumes:
  n8n_data:
```

### Start n8n

```bash
docker-compose up -d n8n
```

### Access n8n

Navigate to `http://localhost:5678` and log in with your credentials.

---

## 4. n8n Workflow Templates

### Workflow 1: Order Notification Handler

Create a new workflow with these nodes:

#### Node 1: Webhook Trigger

- **HTTP Method**: POST
- **Path**: `/webhook/{{eventType}}` (one per event type)
- **Authentication**: Header Auth
- **Header Name**: `Authorization`
- **Header Value**: `Bearer {{your_secret}}`

#### Node 2: Switch (Route by Channel)

Route based on `sendEmail` and `sendSMS` flags.

#### Node 3: SendGrid (Email)

- **Resource**: Email
- **Operation**: Send
- **To Email**: `{{ $json.customer.email }}`
- **Subject**: Order Update - {{ $json.eventType }}
- **HTML Content**: (see templates below)

#### Node 4: Twilio (SMS)

- **Resource**: SMS
- **Operation**: Send
- **To**: `{{ $json.customer.phone }}`
- **From**: `+15551234567`
- **Message**: (see templates below)

### Sample Workflow JSON

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "ready_for_pickup",
        "authentication": "headerAuth",
        "options": {}
      }
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.sendGrid",
      "parameters": {
        "operation": "send",
        "toEmail": "={{ $json.customer.email }}",
        "subject": "Your Order #{{ $json.order.orderNumber }} is Ready for Pickup!",
        "emailFormat": "html"
      }
    },
    {
      "name": "Send SMS",
      "type": "n8n-nodes-base.twilio",
      "parameters": {
        "operation": "send",
        "to": "={{ $json.customer.phone }}",
        "message": "PrintShop: Your order #{{ $json.order.orderNumber }} is ready for pickup!"
      }
    }
  ]
}
```

---

## 5. Message Templates

### Email Templates

#### Ready for Pickup
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #28a745; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Your Order is Ready!</h1>
  </div>
  <div class="content">
    <p>Hi {{ customer.name }},</p>
    <p>Great news! Your order <strong>#{{ order.orderNumber }}</strong> is ready for pickup.</p>
    <p><strong>Pickup Location:</strong><br>
    PrintShop OS<br>
    123 Main Street<br>
    Your City, ST 12345</p>
    <p><strong>Hours:</strong> Mon-Fri 9am-5pm</p>
    <p><a href="{{ trackingUrl }}" class="button">View Order Details</a></p>
  </div>
  <div class="footer">
    <p>Thank you for your business!</p>
  </div>
</body>
</html>
```

#### Shipped
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #6f42c1; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .tracking { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .button { display: inline-block; background: #6f42c1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📦 Your Order Has Shipped!</h1>
  </div>
  <div class="content">
    <p>Hi {{ customer.name }},</p>
    <p>Your order <strong>#{{ order.orderNumber }}</strong> is on its way!</p>
    <div class="tracking">
      <p><strong>Tracking Number:</strong> {{ order.trackingNumber }}</p>
      <p><strong>Carrier:</strong> {{ order.shippingCarrier }}</p>
    </div>
    <p><a href="{{ trackingUrl }}" class="button">Track Your Package</a></p>
  </div>
</body>
</html>
```

### SMS Templates

Keep SMS messages concise (under 160 characters when possible):

#### Ready for Pickup
```
PrintShop: Order #{{ order.orderNumber }} is ready! Pickup at 123 Main St, Mon-Fri 9am-5pm. Questions? Reply HELP
```

#### Shipped
```
PrintShop: Order #{{ order.orderNumber }} shipped! Track: {{ trackingUrl }}
```

#### Payment Received
```
PrintShop: Payment received for order #{{ order.orderNumber }}. We'll update you when production begins!
```

---

## 6. API Endpoints

### Get Notification Preferences
```
GET /api/notifications/preferences/:customerId
```

### Save Notification Preferences
```
POST /api/notifications/preferences
Content-Type: application/json

{
  "customerId": "abc123",
  "emailEnabled": true,
  "smsEnabled": true,
  "smsForPickupOnly": true,
  "emailAddress": "customer@example.com",
  "smsPhone": "+15551234567",
  "preferences": {
    "payment_received": { "email": true, "sms": false },
    "ready_for_pickup": { "email": true, "sms": true },
    "shipped": { "email": true, "sms": true }
  }
}
```

### Manually Trigger Notification
```
POST /api/notifications/send
Content-Type: application/json

{
  "orderId": "order-id-123",
  "eventType": "ready_for_pickup"
}
```

### Send Test Notification
```
POST /api/notifications/test
Content-Type: application/json

{
  "customerId": "abc123",
  "channel": "email" | "sms" | "both"
}
```

---

## 7. Testing

### Test Email Notifications

1. Create a test customer with your email address
2. Navigate to Customer Portal > Notification Settings
3. Enable email notifications
4. Click "Test" button next to email field
5. Check your inbox

### Test SMS Notifications

1. Create a test customer with your phone number
2. Enable SMS notifications
3. Click "Test" button next to phone field
4. Check your phone for SMS

### Test Order Status Workflow

1. Create a test order
2. Update order status to "Ready for Pickup"
3. Verify notifications are sent based on preferences

### n8n Workflow Testing

1. Open your n8n workflow
2. Click "Execute Workflow"
3. Use the test payload:

```json
{
  "eventType": "ready_for_pickup",
  "order": {
    "id": "test-123",
    "orderNumber": "TEST-001",
    "status": "READY_FOR_PICKUP"
  },
  "customer": {
    "id": "cust-123",
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "+15551234567"
  },
  "sendEmail": true,
  "sendSMS": true,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 8. Troubleshooting

### SMS Not Sending

1. Verify Twilio credentials in `.env`
2. Check Twilio account balance
3. Verify phone number format (E.164)
4. Check Twilio console for error logs
5. Ensure `smsEnabled` is true in customer preferences

### Email Not Sending

1. Verify SendGrid API key
2. Check sender email is verified
3. Check email deliverability in SendGrid dashboard
4. Verify `emailEnabled` is true in customer preferences

### n8n Webhook Not Triggering

1. Verify `N8N_WEBHOOK_URL` is correct
2. Check n8n workflow is active
3. Verify webhook authentication header matches
4. Check n8n execution logs

### Lifecycle Hook Not Firing

1. Verify `NOTIFICATIONS_ENABLED=true`
2. Check `API_SERVICE_URL` is correct
3. Verify API service is running
4. Check Strapi logs for errors

---

## 9. Production Checklist

- [ ] Twilio account verified for production
- [ ] Phone number purchased and configured
- [ ] n8n deployed with secure credentials
- [ ] Webhooks configured with HTTPS
- [ ] Environment variables set for production
- [ ] Email sender domain verified in SendGrid
- [ ] Opt-out handling implemented for SMS
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Backup workflow for failed notifications

---

## 10. Cost Considerations

### Twilio Pricing (approximate, check current rates)
- SMS: ~$0.0075/message (US)
- Phone Number: ~$1/month

### n8n
- Self-hosted: Free
- n8n Cloud: Starting at $20/month

### Tips to Reduce Costs
1. Use `smsForPickupOnly` to limit SMS to critical events
2. Batch notifications when possible
3. Use email for non-urgent updates
4. Monitor usage and set alerts

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review n8n and Twilio documentation
3. Check PrintShop OS GitHub issues
4. Contact support@printshop-os.com
