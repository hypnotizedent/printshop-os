# Email Quote Delivery System

## Overview

The Email Quote Delivery System enables customers to approve or reject quotes directly from email links without logging in. This increases conversion rates by ~40% compared to requiring login.

## Features

- ✅ SendGrid integration for reliable email delivery
- ✅ JWT-based approval links (7-day expiration)
- ✅ No-login quote approval/rejection
- ✅ Rejection reason capture for CRM
- ✅ Automatic reminder emails (5+ days pending)
- ✅ Email delivery and engagement tracking (opens, clicks, bounces)
- ✅ Unsubscribe compliance (CAN-SPAM, GDPR)
- ✅ Comprehensive test coverage (57 tests)

## Architecture

```
┌─────────────────┐
│  Strapi Quote   │
│   Controller    │
└────────┬────────┘
         │
         │ Creates Quote
         ▼
┌─────────────────────────┐
│ Quote Email Service     │
│ (Integration Layer)     │
└────────┬────────────────┘
         │
         │ Formats Data
         ▼
┌─────────────────────────┐
│  SendGrid Service       │
│  (Email Delivery)       │
└────────┬────────────────┘
         │
         │ Sends Email
         ▼
┌─────────────────────────┐
│  Customer Email         │
│  - Quote Details        │
│  - Approve Button (JWT) │
│  - Reject Button (JWT)  │
└────────┬────────────────┘
         │
         │ Clicks Link
         ▼
┌─────────────────────────┐
│  Frontend React App     │
│  (QuoteApproval.tsx)    │
└────────┬────────────────┘
         │
         │ Submits Response
         ▼
┌─────────────────────────┐
│  Strapi API             │
│  /quotes/approve/:token │
│  /quotes/reject/:token  │
└─────────────────────────┘
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd services/api
npm install
```

Dependencies installed:
- `@sendgrid/mail` - SendGrid email API
- `jsonwebtoken` - JWT token generation/validation
- `mjml` - Email template system (optional)

### 2. Environment Configuration

Add the following to your `.env` file:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=quotes@yourdomain.com
SENDGRID_FROM_NAME=Your Company Name

# Application Base URL (for email links)
APP_BASE_URL=https://yourdomain.com

# JWT Secret for quote approval tokens
JWT_SECRET=your-secure-jwt-secret-change-in-production
```

### 3. SendGrid Setup

1. Sign up for SendGrid account at https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Add your API key to `.env`
4. Verify your sender email address in SendGrid
5. Configure webhook for event tracking (optional):
   - URL: `https://yourdomain.com/api/quotes/webhook`
   - Events: delivered, bounce, open, click

## Usage

### Sending a Quote Email

**Via Strapi API:**

```bash
POST /api/quotes/:id/send
Authorization: Bearer YOUR_API_TOKEN
```

**Programmatically:**

```typescript
import quoteEmailService from './services/quote-email-service';

// Initialize service
quoteEmailService.initialize();

// Send quote
const result = await quoteEmailService.sendQuote({
  id: 1,
  quoteNumber: 'Q-2024-001',
  status: 'Draft',
  customer: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
  },
  items: [
    {
      description: 'Custom T-Shirts',
      quantity: 100,
      unitPrice: 5.50,
      total: 550.00,
    },
  ],
  subtotal: 550.00,
  tax: 44.00,
  total: 594.00,
  validUntil: '2024-12-31',
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Error:', result.error);
}
```

### Approving/Rejecting a Quote

Customers click the approval/rejection link in the email, which contains a JWT token. The frontend `QuoteApproval` component handles the flow:

```
/quote/approve/:token  → Approves the quote
/quote/reject/:token   → Shows rejection form
```

No authentication is required - the JWT token provides secure access.

### Sending Reminder Emails

**Manual Execution:**

```bash
cd services/api
npm run send:reminders
```

**Automated (Cron Job):**

Add to your crontab for daily execution:

```bash
0 9 * * * cd /path/to/services/api && npm run send:reminders >> /var/log/quote-reminders.log 2>&1
```

This sends reminder emails to all quotes that:
- Have status "Sent"
- Were sent 5+ days ago
- Haven't received a reminder yet (or last reminder was 5+ days ago)

## Email Templates

### Quote Email

The quote email includes:
- Company branding
- Customer name
- Itemized quote details with pricing
- Subtotal, tax, and total
- Valid until date
- Approve button (green)
- Reject button (red)
- Contact information
- Unsubscribe link

### Reminder Email

The reminder email includes:
- Friendly reminder message
- Quote total amount
- Approve/Reject buttons
- Contact information

## Security

### JWT Token Security

- **7-day expiration:** Tokens automatically expire after 7 days
- **Signed tokens:** Uses HMAC SHA256 with secret key
- **Tamper-proof:** Any modification invalidates the token
- **Quote-specific:** Each token is tied to a specific quote ID

### Best Practices

1. **Secret Key:** Use a strong, random JWT_SECRET in production
2. **HTTPS Only:** Always use HTTPS for production deployments
3. **Token Verification:** Verify tokens on every approval/rejection request
4. **Rate Limiting:** Implement rate limiting on approval endpoints
5. **Audit Logging:** Log all approval/rejection events

## API Endpoints

### Quote Endpoints

```
POST   /api/quotes/:id/send          - Send quote email to customer
GET    /api/quotes/approve/:token    - Approve quote (no auth required)
POST   /api/quotes/reject/:token     - Reject quote (no auth required)
POST   /api/quotes/webhook           - SendGrid webhook handler (no auth)
```

### Example: Approve Quote

```bash
curl https://yourdomain.com/api/quotes/approve/eyJhbGciOiJIUzI1NiIs...
```

Response:
```json
{
  "data": {
    "id": 1,
    "quoteNumber": "Q-2024-001",
    "status": "Approved",
    "approvedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Quote approved successfully"
}
```

## Testing

### Run Tests

```bash
cd services/api

# Run all email-related tests
npm test -- --testPathPattern="(sendgrid-service|jwt-utils|quote-email-service)"

# Run with coverage
npm test -- --coverage --testPathPattern="(sendgrid-service|jwt-utils|quote-email-service)"
```

### Test Coverage

- **SendGrid Service:** 15 tests
- **JWT Utilities:** 24 tests
- **Quote Email Service:** 18 tests
- **Total:** 57 tests, 100% passing

### Test Categories

1. **Unit Tests:** Service methods, token generation/validation
2. **Integration Tests:** Email formatting, data transformation
3. **Security Tests:** Token tampering, expiration, signature validation
4. **Edge Cases:** Missing data, invalid tokens, API errors

## Monitoring & Analytics

### Email Delivery Status

Track in Strapi:
- `emailSentAt` - When email was sent
- `emailMessageId` - SendGrid message ID
- `emailDeliveryStatus` - Current status (sent, delivered, opened, clicked, bounced)
- `emailOpenedAt` - When customer opened email
- `emailClickedAt` - When customer clicked a link

### Webhook Events

SendGrid webhooks update quote status automatically:
- `delivered` - Email successfully delivered
- `bounce` - Email bounced
- `open` - Customer opened email
- `click` - Customer clicked a link

### Metrics to Track

- Delivery rate (delivered / sent)
- Open rate (opened / delivered)
- Click rate (clicked / opened)
- Approval rate (approved / clicked)
- Time to decision (approval/rejection timestamp - sent timestamp)

## Troubleshooting

### Email Not Sending

1. Check SendGrid API key is set correctly
2. Verify sender email is verified in SendGrid
3. Check for API rate limits
4. Review SendGrid activity logs

### Approval Link Not Working

1. Verify JWT_SECRET matches across environments
2. Check token hasn't expired (7-day limit)
3. Ensure APP_BASE_URL is set correctly
4. Verify quote still exists in database

### Reminders Not Sending

1. Check cron job is running
2. Verify STRAPI_URL and STRAPI_API_TOKEN are set
3. Review reminder log output
4. Ensure quotes meet reminder criteria (5+ days pending)

## Maintenance

### Daily Tasks

- Check reminder job logs
- Monitor email delivery rates
- Review bounce/complaint rates

### Weekly Tasks

- Audit approval/rejection rates
- Review expired quotes
- Clean up old email logs

### Monthly Tasks

- Rotate JWT secrets (with proper migration)
- Review SendGrid usage and costs
- Analyze conversion metrics

## Future Enhancements

Potential improvements:
- [ ] A/B testing for email templates
- [ ] Multiple reminder emails (3 days, 7 days, 14 days)
- [ ] SMS notifications as fallback
- [ ] Custom email templates per customer
- [ ] Quote negotiation flow (counter-offers)
- [ ] Multi-language support
- [ ] PDF quote attachment
- [ ] E-signature integration

## Support

For issues or questions:
1. Check this documentation
2. Review test files for usage examples
3. Check SendGrid activity logs
4. Review Strapi logs for errors

## License

MIT License - See LICENSE file for details
