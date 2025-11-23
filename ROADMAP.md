# Project Roadmap: Print Shop Operations Hub (Level 1 MVP)

This document outlines the step-by-step technical plan for building the Level 1 Minimum Viable Product (MVP) for a custom digital operations hub.

## Core Architecture

The architecture will consist of three main open-source components:
1.  **A Headless CMS (Strapi)** to act as the central database and API.
2.  **An Internal Tool Builder (Appsmith)** for the production team’s dashboard.
3.  **A Conversational AI Framework (Botpress)** for the customer-facing order intake.

---

## Phase 1: Setup the Central Brain (Strapi)

**Objective:** Create the foundational data structure for the entire application.

*   **Step 1.1: Setup Strapi Project**
    *   Initialize a new Strapi project following the official documentation.
    *   Configure the database (e.g., SQLite for development, PostgreSQL for production).

*   **Step 1.2: Define Collection Types (Data Models)**
    *   Using the Strapi Content-Type Builder, create the following collections:
    *   **Job**:
        *   `JobID` (Text, Required, Unique) - Can be auto-generated.
        *   `Status` (Enumeration: "Pending Artwork", "In Production", "Complete", "Archived") - Default to "Pending Artwork".
        *   `MockupImageURL` (Text)
        *   `ArtFileURL` (Text)
        *   `InkColors` (JSON)
        *   `ImprintLocations` (JSON)
        *   `Quantity` (Integer)
        *   `Customer` (Relation - `Job` has one `Customer`)
    *   **Customer**:
        *   `Name` (Text, Required)
        *   `Email` (Email, Required, Unique)
        *   `Jobs` (Relation - `Customer` has many `Jobs`)
    *   **Employee**:
        *   `EmployeeID` (Text, Required, Unique)
        *   `Name` (Text, Required)
    *   **TimeClockEntry**:
        *   `Timestamp` (DateTime, Required)
        *   `EntryType` (Enumeration: "Clock In", "Clock Out")
        *   `Employee` (Relation - `TimeClockEntry` belongs to one `Employee`)

*   **Step 1.3: Set API Permissions**
    *   Enable public `find` and `findOne` permissions for necessary collections.
    *   Enable authenticated `create`, `update` permissions for the API tokens that Appsmith and Botpress will use.

---

## Phase 2: Build the Internal Production Dashboard (Appsmith) + Customer Portal

**Objective:** Create a simple, functional mobile interface for the production team AND a customer-facing design portal for artwork/mockups.

### Part 2A: Internal Production Dashboard (Appsmith)

*   **Step 2.1: Setup Appsmith and Connect to Strapi**
    *   Create a new application in Appsmith.
    *   Create a new Datasource, connecting to the Strapi API using its base URL and an API token.

*   **Step 2.2: Create the Main Job List View**
    *   Add a Table or List widget to the canvas.
    *   Set its data source to query the `Job` collection from the Strapi API, filtering for jobs where `Status` is "In Production."
    *   Prioritize displaying the `MockupImageURL` (as an image), `JobID`, and `Customer.Name` in the list view.

*   **Step 2.3: Build the Job Details Page**
    *   Create a second page or a modal for viewing job details.
    *   When a job is selected from the list, navigate to this page and pass the `JobID`.
    *   Display all relevant job information, ordered by the priority you specified: Mockup, Art File, Colors, Locations, etc.

*   **Step 2.4: Implement Actions**
    *   Add a "Mark as Complete" button that triggers an `update` query to the Strapi API, changing the `Status` of the current job to "Complete".
    *   Create a separate, simple page for "Time Clock" with "Clock In" and "Clock Out" buttons that create a new `TimeClockEntry` in Strapi, linking to the logged-in employee.

### Part 2B: Customer Portal & Design System (New)

**Objective:** Build customer-facing design/mockup portal with interactive canvas and quote generation.

*   **Step 2B.1: Setup Customer Portal Service** 
    *   Create new service: `services/customer-portal/`
    *   Integrate design canvas library (Fabric.js) for interactive mockups
    *   Implement shadcn-ui component library for consistent UI
    *   **Source**: Migrated from `custom-studio-app` repository
    *   **See**: `docs/CUSTOM_STUDIO_APP_INTEGRATION_STRATEGY.md`

*   **Step 2B.2: Create Design Canvas Component**
    *   Garment silhouette rendering (t-shirt, hoodie, tank-top, etc.)
    *   Interactive design placement and manipulation
    *   Real-time mockup preview
    *   Mobile-responsive interface

*   **Step 2B.3: Integrate with Pricing Engine**
    *   Connect `services/job-estimator/lib/pricing-engine.ts`
    *   Real-time price updates as design changes
    *   Quantity selector with volume discounts
    *   Add-ons and special services pricing

*   **Step 2B.4: Connect to Quote System**
    *   Design canvas → Strapi Job record (MockupImageURL)
    *   Quote generation with embedded mockups
    *   Approval workflow integration
    *   PDF export with mockup preview

*   **Step 2B.5: Authentication Integration**
    *   Strapi JWT authentication
    *   Customer login/signup flow
    *   Session persistence
    *   Account profile management

---

## Phase 3: Create a Proof-of-Concept for Customer Order Intake (Botpress)

**Objective:** Validate the concept of a conversational intake flow that feeds data into the central system.

*   **Step 3.1: Setup Botpress Project**
    *   Initialize a new Botpress project.

*   **Step 3.2: Design the Conversational Flow**
    *   Use the Botpress flow editor to create a simple, guided conversation.
    *   Create nodes to ask for the user's Name, Email, and desired Quantity.
    *   Store these values as variables.

*   **Step 3.3: Implement the API Call**
    *   At the end of the flow, create an action that makes a POST request to your Strapi API.
    *   The action should first create a `Customer` (or find an existing one by email).
    *   Then, it should create a new `Job`, associating it with the customer and populating the `Quantity`. The `Status` should be set to "Pending Artwork".