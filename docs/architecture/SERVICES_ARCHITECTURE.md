# PrintShop OS - Services Architecture

## Overview
Services are organized as independent, deployable units with clear responsibilities.

## Available Services

### 1. **API** (`services/api/`)
Central REST/GraphQL API powered by Strapi.

- **Purpose:** Customer management, order processing, inventory
- **Technology:** Node.js / Strapi
- **Port:** 1337
- **Deploy:** Docker / Kubernetes
- **Docs:** `docs/api/strapi-endpoints.md`

```bash
cd services/api
npm install
npm run develop  # Dev
npm run build && npm start  # Prod
```

---

### 2. **Customer Service AI** (`services/customer-service-ai/`)
Intelligent automation for customer interactions via Botpress.

- **Purpose:** Chatbot, Q&A, support automation
- **Technology:** Python / Botpress / LLM
- **Port:** Custom (see config)
- **Deploy:** Docker / Kubernetes
- **Docs:** `docs/phases/phase-4-botpress.md`

```bash
cd services/customer-service-ai
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

### 3. **Metadata Extraction** (`services/metadata-extraction/`)
Scrapes and processes order data, images, and metadata.

- **Purpose:** Data ingestion from Printavo, image processing
- **Technology:** Python / BeautifulSoup / Requests
- **Trigger:** Manual / Scheduled / Webhook
- **Deploy:** Docker / Cron job
- **Docs:** `docs/architecture/data-flow.md`

```bash
cd services/metadata-extraction
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scrape_image_urls.py
```

---

## Service Communication

```
┌─────────────────────────────────────────────┐
│           Botpress Chatbot                  │
│      (Customer Service AI)                  │
│  Port: 3000 / Webhook: /api/webhook        │
└──────────────┬──────────────────────────────┘
               │ HTTP REST
               ▼
┌─────────────────────────────────────────────┐
│        Strapi API                           │
│   (Central API & Database)                  │
│  Port: 1337 / Endpoints: /api/*            │
└──────────────┬──────────────────────────────┘
               │ Database
               ▼
        PostgreSQL Database
        Port: 5432


┌─────────────────────────────────────────────┐
│   Metadata Extraction                       │
│     (Data Ingestion)                        │
│  Runs: Scheduled / On-demand                │
└──────────────┬──────────────────────────────┘
               │ HTTP REST / Database
               ▼
        Strapi API (Import endpoint)
```

---

## Environment Variables

Each service has its own `.env` file:

### `services/api/.env`
```bash
NODE_ENV=development
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=printshop
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=strapi_password
```

### `services/customer-service-ai/.env`
```bash
BOTPRESS_API_KEY=your_key
STRAPI_API_URL=http://localhost:1337
BOTPRESS_WORKSPACE=default
LLM_MODEL=mistral-7b
```

### `services/metadata-extraction/.env`
```bash
PRINTAVO_EMAIL=your@email.com
PRINTAVO_TOKEN=your_token
STRAPI_API_URL=http://localhost:1337
OUTPUT_DIR=./data/processed
```

---

## Deployment

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

### Homelab Deployment
See `docs/deployment/homelab-setup.md`

### Production
See `docs/deployment/production-deployment.md`

---

## Service Dependencies

| Service | Depends On | Startup Order |
|---------|-----------|---------------|
| PostgreSQL | None | 1st |
| Strapi API | PostgreSQL | 2nd |
| Botpress | Strapi | 3rd |
| Metadata Extraction | Strapi | 3rd (independent) |

---

## Monitoring & Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api

# Check service status
docker-compose ps
```

---

## Next Steps
1. Ensure all services start correctly
2. Test API endpoints: `curl http://localhost:1337/api/customers`
3. Deploy to Homelab server
4. Set up monitoring dashboard
5. Configure backup strategy
