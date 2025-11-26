# Phase 3: Botpress Integration - Customer Order Intake

## Overview

This guide provides detailed instructions for creating a conversational AI bot using Botpress to automate customer order intake. The bot will collect customer information and create jobs in Strapi through API integration.

**Estimated Time:** 3-4 hours for complete setup  
**Skill Level:** Intermediate (JavaScript knowledge helpful)  
**Prerequisites:** Phase 1 (Strapi) completed and running

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Botpress Installation](#botpress-installation)
3. [Initial Setup](#initial-setup)
4. [Creating Conversational Flows](#creating-conversational-flows)
5. [Variable Management](#variable-management)
6. [API Action Configuration](#api-action-configuration)
7. [Testing the Chatbot](#testing-the-chatbot)
8. [Deployment Options](#deployment-options)
9. [Webhook Integration](#webhook-integration)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

- **Phase 1 Complete**: Strapi running with API accessible
- **Strapi API Token**: From Phase 1
- **Strapi URL**: e.g., `http://localhost:1337`
- **Node.js 16+**: For local development (if not using Docker)

### Recommended

- Basic understanding of conversation design
- Familiarity with REST APIs
- JavaScript basics

---

## Botpress Installation

### Option A: Docker (Recommended)

**Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  botpress:
    image: botpress/server:latest
    container_name: printshop-botpress
    restart: unless-stopped
    environment:
      BP_HOST: 0.0.0.0
      BP_PORT: 3000
      BP_PRODUCTION: false
      EXTERNAL_URL: http://localhost:3000
      DATABASE_URL: postgres://botpress:botpress_password@postgres:5432/botpress
    volumes:
      - botpress_data:/botpress/data
    ports:
      - "3000:3000"
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    container_name: botpress-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: botpress
      POSTGRES_PASSWORD: botpress_password
      POSTGRES_DB: botpress
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  botpress_data:
  postgres_data:
```

**Start Botpress:**

```bash
# Create directory
mkdir printshop-botpress
cd printshop-botpress

# Create docker-compose.yml (use content above)

# Start services
docker-compose up -d

# View logs
docker-compose logs -f botpress
```

**Access:** `http://localhost:3000`

### Option B: Local Installation

```bash
# Download Botpress
npx create-botpress-app printshop-bot

# Navigate to directory
cd printshop-bot

# Start Botpress
npm start
```

**Access:** `http://localhost:3000`

---

## Initial Setup

### Step 1: Create Admin Account

1. Open `http://localhost:3000`
2. Click **Register**
3. Fill in:
   - **Email:** admin@printshop.local
   - **Password:** Strong password (min 8 characters)
4. Click **Register**

### Step 2: Create Bot

1. After login, you'll see the **Workspace**
2. Click **Create Bot**
3. Fill in:
   - **Bot Name:** `PrintShop Order Bot`
   - **Bot ID:** `printshop-order-bot`
   - **Template:** Start from scratch
4. Click **Create Bot**

### Step 3: Configure Environment Variables

Create `.env` file in Botpress directory:

```env
# Strapi Integration
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_api_token_from_phase_1

# Bot Configuration
BP_HOST=0.0.0.0
BP_PORT=3000
```

For Docker, add these to docker-compose.yml:

```yaml
environment:
  STRAPI_URL: http://host.docker.internal:1337
  STRAPI_API_TOKEN: your_api_token_here
```

---

## Creating Conversational Flows

### Step 1: Access Flow Editor

1. In Botpress Studio, click on your bot
2. Click **Flows** in left sidebar
3. You'll see the **Main** flow

### Step 2: Design Welcome Flow

**Node 1: Entry (automatically created)**
- This is where conversation starts

**Node 2: Greeting**
1. Click **+ Add Node** or double-click on canvas
2. Select **Say Something** (under Standard)
3. Click on the node to edit
4. Add content:
   ```
   Welcome to PrintShop! 👕
   
   I'm here to help you place an order. This will only take a minute!
   
   Let's get started.
   ```
5. Click **Save**

### Step 3: Collect Customer Name

**Node 3: Ask Name**
1. Add node: **Capture Information** (under Input)
2. Configure:
   - **Question:** 
     ```
     What's your name?
     ```
   - **Variable:** `user.name`
   - **Retry message:**
     ```
     I didn't quite catch that. What's your name?
     ```
   - **Max retries:** 3
3. Click **Save**

### Step 4: Collect Email

**Node 4: Ask Email**
1. Add node: **Capture Information**
2. Configure:
   - **Question:**
     ```
     Thanks {{user.name}}! What's your email address?
     ```
   - **Variable:** `user.email`
   - **Content Type:** Email (validates format)
   - **Validation:** Email validation enabled
   - **Retry message:**
     ```
     That doesn't look like a valid email. Please try again.
     ```
3. Click **Save**

### Step 5: Collect Quantity

**Node 5: Ask Quantity**
1. Add node: **Capture Information**
2. Configure:
   - **Question:**
     ```
     How many items do you need? (Please enter a number)
     ```
   - **Variable:** `user.quantity`
   - **Content Type:** Number
   - **Min value:** 1
   - **Max value:** 10000
   - **Retry message:**
     ```
     Please enter a valid quantity (between 1 and 10,000).
     ```
3. Click **Save**

### Step 6: Confirmation

**Node 6: Confirm Order**
1. Add node: **Say Something**
2. Content:
   ```
   Perfect! Let me confirm your details:
   
   Name: {{user.name}}
   Email: {{user.email}}
   Quantity: {{user.quantity}}
   
   Creating your order now...
   ```
3. Click **Save**

### Step 7: Connect Nodes

1. Click on **Entry** node
2. Drag from the output port (circle on right) to **Greeting** node
3. Connect **Greeting** → **Ask Name**
4. Connect **Ask Name** → **Ask Email**
5. Connect **Ask Email** → **Ask Quantity**
6. Connect **Ask Quantity** → **Confirm Order**

---

## Variable Management

### Understanding Variables

Botpress uses variables to store information:

- **user.** - User-specific data (persists across sessions)
- **temp.** - Temporary data (cleared after conversation)
- **session.** - Session data (cleared when conversation ends)

### Variables We'll Use

```javascript
// User information
user.name = "John Doe"
user.email = "john@example.com"
user.quantity = 100

// Temporary storage for API responses
temp.customerId = 1
temp.jobId = "JOB-2025-001"
temp.error = null
```

---

## API Action Configuration

### Step 1: Create Action - Find or Create Customer

1. In Bot Studio, click **Code** in left sidebar
2. Click **Actions** tab
3. Click **+ Create Action**
4. Name: `findOrCreateCustomer`
5. Code:

```javascript
/**
 * Find or create customer in Strapi
 * @title Find or Create Customer
 * @category Custom
 * @author PrintShop
 */
const axios = require('axios')

const findOrCreateCustomer = async () => {
  const { name, email } = user
  const STRAPI_URL = process.env.STRAPI_URL
  const API_TOKEN = process.env.STRAPI_API_TOKEN

  try {
    // Step 1: Check if customer exists
    const findResponse = await axios.get(
      `${STRAPI_URL}/api/customers?filters[Email][$eq]=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`
        }
      }
    )

    if (findResponse.data.data.length > 0) {
      // Customer exists
      temp.customerId = findResponse.data.data[0].id
      bp.logger.info(`Customer found: ${temp.customerId}`)
    } else {
      // Create new customer
      const createResponse = await axios.post(
        `${STRAPI_URL}/api/customers`,
        {
          data: {
            Name: name,
            Email: email
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${API_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )

      temp.customerId = createResponse.data.data.id
      bp.logger.info(`Customer created: ${temp.customerId}`)
    }

    temp.error = null

  } catch (error) {
    bp.logger.error('Error with customer:', error.message)
    temp.error = 'Unable to process customer information. Please try again.'
    temp.customerId = null
  }
}

return findOrCreateCustomer()
```

6. Click **Save**

### Step 2: Create Action - Create Job

1. Click **+ Create Action**
2. Name: `createJob`
3. Code:

```javascript
/**
 * Create job in Strapi
 * @title Create Job
 * @category Custom
 * @author PrintShop
 */
const axios = require('axios')

const createJob = async () => {
  const { quantity } = user
  const { customerId } = temp
  const STRAPI_URL = process.env.STRAPI_URL
  const API_TOKEN = process.env.STRAPI_API_TOKEN

  if (!customerId) {
    temp.error = 'Customer ID not found. Please restart the conversation.'
    return
  }

  try {
    const response = await axios.post(
      `${STRAPI_URL}/api/jobs`,
      {
        data: {
          Status: 'Pending Artwork',
          Quantity: parseInt(quantity),
          customer: customerId
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    temp.jobId = response.data.data.attributes.JobID
    temp.jobDbId = response.data.data.id
    temp.error = null

    bp.logger.info(`Job created: ${temp.jobId}`)

  } catch (error) {
    bp.logger.error('Error creating job:', error.message)
    temp.error = 'Unable to create order. Please try again.'
    temp.jobId = null
  }
}

return createJob()
```

4. Click **Save**

### Step 3: Add Actions to Flow

**After Confirm Order node:**

1. Add node: **Execute Code** (under Advanced)
2. Name it: `Find/Create Customer`
3. Select action: `findOrCreateCustomer`
4. Click **Save**

**After Find/Create Customer node:**

1. Add node: **Execute Code**
2. Name it: `Create Job`
3. Select action: `createJob`
4. Click **Save**

### Step 4: Add Success/Error Handling

**Success Node:**
1. Add node: **Say Something**
2. Content:
   ```
   🎉 Success! Your order {{temp.jobId}} has been created!
   
   We'll contact you at {{user.email}} to collect your artwork.
   
   Thank you for choosing PrintShop!
   ```
3. Condition: `temp.error === null`

**Error Node:**
1. Add node: **Say Something**
2. Content:
   ```
   😕 Oops! Something went wrong: {{temp.error}}
   
   Please try again or contact us directly.
   ```
3. Condition: `temp.error !== null`

### Step 5: Connect Action Nodes

1. **Confirm Order** → **Find/Create Customer**
2. **Find/Create Customer** → **Create Job**
3. **Create Job** → Decision:
   - If `temp.error === null` → **Success Node**
   - If `temp.error !== null` → **Error Node**

---

## Testing the Chatbot

### Step 1: Use Emulator

1. Click **Emulator** button (chat icon in top right)
2. Start conversation by typing anything
3. Follow the flow:
   - Enter your name
   - Enter your email
   - Enter quantity
   - Confirm order created

### Step 2: Verify in Strapi

1. Open Strapi admin: `http://localhost:1337/admin`
2. Go to **Content Manager** → **Customers**
3. Verify new customer created
4. Go to **Content Manager** → **Jobs**
5. Verify new job created with correct data

### Step 3: Test Error Handling

**Test invalid email:**
1. Enter invalid email format
2. Verify retry message appears

**Test invalid quantity:**
1. Enter negative number or text
2. Verify retry message appears

### Step 4: Reset and Test Again

1. Click **Reset** in emulator
2. Test complete flow again with different data

---

## Deployment Options

### Option 1: Web Widget

**Embed on your website:**

1. In Botpress, go to **Code** → **Config**
2. Enable **Webchat** channel
3. Copy embed code:

```html
<script src="http://localhost:3000/assets/modules/channel-web/inject.js"></script>
<script>
  window.botpressWebChat.init({
    host: 'http://localhost:3000',
    botId: 'printshop-order-bot'
  })
</script>
```

4. Add to your website's HTML

### Option 2: Standalone Page

**Direct link to chat:**

```
http://localhost:3000/s/printshop-order-bot
```

Share this URL with customers.

### Option 3: Mobile App (Future)

Botpress supports mobile SDK integration for iOS and Android apps.

### Option 4: Messaging Platforms (Future)

Can integrate with:
- WhatsApp
- Facebook Messenger
- Telegram
- Slack

---

## Webhook Integration

### Setup Webhook for Real-Time Updates

**In Strapi:**

1. Go to **Settings** → **Webhooks**
2. Click **Add new webhook**
3. Configure:
   - **Name:** Botpress Notification
   - **URL:** `http://localhost:3000/api/v1/webhooks/strapi`
   - **Events:** Select:
     - `job.create`
     - `job.update`
4. Click **Save**

**In Botpress:**

Create webhook handler in Code → Actions:

```javascript
/**
 * Handle Strapi webhook
 * @title Webhook Handler
 */
const handleWebhook = async (req) => {
  const { event, model, entry } = req.body
  
  if (model === 'job' && event === 'entry.update') {
    // Send notification to customer about job status change
    // This would require customer's conversation ID
    bp.logger.info(`Job ${entry.JobID} status changed to ${entry.Status}`)
  }
}

return handleWebhook(event.payload)
```

---

## Troubleshooting

### Issue: "Cannot connect to Strapi"

**Symptoms:** Actions fail, API errors in logs

**Solutions:**
1. Verify Strapi is running:
   ```bash
   curl http://localhost:1337/api/customers
   ```
2. Check environment variables:
   ```bash
   echo $STRAPI_URL
   echo $STRAPI_API_TOKEN
   ```
3. For Docker, use `http://host.docker.internal:1337`
4. Check API token is valid in Strapi

### Issue: "Action execution failed"

**Symptoms:** Actions don't execute, errors in logs

**Solutions:**
1. Check Botpress logs:
   ```bash
   docker-compose logs botpress
   # or
   tail -f data/logs/bot.log
   ```
2. Verify axios is available (it should be built-in)
3. Add error logging to actions:
   ```javascript
   bp.logger.error('Full error:', error)
   ```

### Issue: "Customer created but job fails"

**Symptoms:** Customer exists but job creation fails

**Solutions:**
1. Verify `temp.customerId` is set
2. Check Strapi permissions for jobs
3. Verify job data structure matches Strapi schema
4. Check quantity is a valid integer

### Issue: "Variables not persisting"

**Symptoms:** Data lost between nodes

**Solutions:**
1. Use `user.` for persistent data
2. Use `temp.` only for temporary data
3. Verify variable names are consistent
4. Check flow transitions are connected

---

## Next Steps

After completing Phase 3:

1. **Test end-to-end** flow multiple times
2. **Customize messages** to match your brand voice
3. **Add more validations** as needed
4. **Plan deployment** strategy
5. **Train staff** on monitoring bot conversations
6. **Set up analytics** to track bot performance

---

## Additional Resources

- [Botpress Documentation](https://botpress.com/docs)
- [Botpress Community](https://forum.botpress.com/)
- [Creating Flows](https://botpress.com/docs/building-chatbots/flow-editor)
- [Actions Documentation](https://botpress.com/docs/building-chatbots/actions)

---

**Phase 3 Complete! ✅**

You now have a fully functional conversational AI bot that automates customer order intake and integrates seamlessly with your Strapi backend!

**All three phases complete!** Your PrintShop OS MVP is now operational with:
- ✅ Strapi: Central data and API
- ✅ Appsmith: Production dashboard
- ✅ Botpress: Customer order intake

Congratulations! 🎉
