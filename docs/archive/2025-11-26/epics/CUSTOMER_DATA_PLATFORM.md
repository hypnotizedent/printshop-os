# Customer Data Platform (CDP) & Asset Management

> **Goal:** Create a "Home" for customer data that acts as the single source of truth for Assets, Preferences, Shipping, and Analytics.

## 1. The "Customer Home" (Database Schema)

We will expand the Strapi `Customer` model to be more than just a name and email.

### Core Models

#### `Customer` (The Entity)
*   **Company Name:** (e.g., "Mane Coffee")
*   **Industry:** (Enum: `Streetwear`, `Service`, `Corporate`, `Event`, `Non-Profit`)
*   **Status:** (Active, Churned, Prospect)
*   **Tier:** (VIP, Standard, Wholesale)
*   **Account Manager:** (Linked Employee)

#### `Contact` (The People)
*   *One Customer can have multiple Contacts.*
*   **Name:** "Daniel Karram"
*   **Role:** "Owner", "Designer", "Accounts Payable"
*   **Email/Phone:**
*   **Preferences:** "Prefer Text", "Do not call before 10am"

#### `Address` (The Shipping Engine - **CRITICAL**)
*   *Addresses are IMMUTABLE. We never edit an address record once used. We create a new one.*
*   **Type:** (Shipping, Billing)
*   **Hash:** (Unique hash of the address string to detect duplicates)
*   **Verified:** (Boolean - via EasyPost)
*   **Active:** (Boolean)
*   **Used In Orders:** (Relation to Order History)

## 2. The "Asset Vault" (File Management)

We need a structured way to store files so the Agent (and you) can find them instantly.

### Directory Structure (S3 / Local)
```
/assets
  /{customer_id_slug}/          # e.g., mane-coffee
    /brand_assets/
      /logos/
        /vector/                # .ai, .eps, .pdf
        /raster/                # .png, .jpg
      /fonts/
      /brand_guides/
    /orders/
      /{order_id}/
        /mockups/
        /production_files/      # The final .dst or sep file
        /proofs/
```

### The "Asset" Content Type in Strapi
*   **File:** (Media Object)
*   **Type:** (Logo, Mockup, Print File, DST)
*   **Tags:** ("Chest Logo", "2024 Rebrand", "Distressed")
*   **Status:** (Approved, Archived, Draft)
*   **Version:** (v1, v2, v3)

## 3. The "Intelligence Layer" (Analytics)

We will run nightly jobs to analyze `Order` history and update the `Customer` profile.

### Computed Fields (Read-Only)
*   **Preferred Blanks:** "Comfort Colors 1717", "Otto Caps" (Based on volume)
*   **Avg Order Value (AOV):** $1,250
*   **Order Rhythm:** "Every 45 days" (Predictive reorder alerts)
*   **Seasonality:** "Orders heavy in Q4"

## 4. Workflows

### A. The "Inquiry-to-Order" Flow
1.  **Inquiry Received:** Agent checks email domain against `Contact` records.
2.  **Match Found:** Agent pulls up "Mane Coffee".
    *   *Context Loaded:* "They like Comfort Colors. Last order was 2 months ago. We have their logo on file (v3)."
3.  **Asset Check:** Agent asks: "Are we using the existing 'Circle Logo' (v3)?"
4.  **Quote Created:** Uses stored address and preferred blanks.

### B. The "Address Change" Flow
1.  Customer emails: "We moved! New address is..."
2.  System actions:
    *   Mark old `Address` as `Active: False` (but keep it for history).
    *   Create NEW `Address` record.
    *   Validate via EasyPost API.
    *   Flag "Address Changed" on next order.

## 5. Implementation Roadmap

### Phase 1: The Foundation (Data Migration)
*   [ ] Create `Customer`, `Contact`, `Address` models in Strapi.
*   [ ] Write script to import `customers.json` from Printavo.
*   [ ] "Industry Classifier" script (LLM guesses industry based on Company Name).

### Phase 2: Asset Organization
*   [ ] Create `Asset` model.
*   [ ] Script to organize existing files into the `/assets/{customer}/` structure.

### Phase 3: Intelligence
*   [ ] "Blank Analyzer" script: Parse `orders.json` line items to populate "Preferred Blanks".
