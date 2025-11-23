# Setup for Local Development

## Prerequisites

- **Node.js** 18+ (for Strapi)
- **Python** 3.9+ (for scrapers & AI)
- **PostgreSQL** 15+ or **Docker** (for database)
- **Docker Compose** 2.x (recommended for full stack)
- **Git** (with submodules support)

---

## Quick Start (Docker Compose)

The easiest way to run the full PrintShop OS stack locally:

```bash
# Clone the repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f
```

**Access Points:**
- **Strapi Admin:** http://localhost:1337/admin
- **API:** http://localhost:1337/api
- **Botpress:** http://localhost:3000
- **Database:** localhost:5432

---

## Manual Setup (For Development)

### 1. Clone Repository

```bash
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Initialize submodules
git submodule update --init --recursive
```

### 2. Set Up Python Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# or
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up Strapi

```bash
cd services/api

# Install Node dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Start in development mode
npm run develop
```

### 4. Set Up Botpress AI Service

```bash
cd ../../services/customer-service-ai

# Create Python environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure .env
cp .env.example .env

# Start the service
python main.py
```

### 5. Configure Database

**Option A: Docker (Recommended)**
```bash
docker run -d \
  --name printshop-postgres \
  -e POSTGRES_USER=strapi \
  -e POSTGRES_PASSWORD=strapi_password \
  -e POSTGRES_DB=printshop \
  -p 5432:5432 \
  postgres:15-alpine
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb -U postgres printshop

# Update services/api/.env
DATABASE_HOST=localhost
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
```

---

## Project Structure

```
printshop-os/
├── services/
│   ├── api/              # Strapi CMS & API
│   ├── customer-service-ai/  # AI Chatbot
│   └── metadata-extraction/  # Data ingestion
├── scripts/
│   ├── transform/        # Data transformers
│   └── create-all-70-issues.py  # GitHub automation
├── packages/
│   └── shared/          # Shared utilities
├── tests/               # Test suites
├── docs/               # Documentation
├── requirements.txt    # Python dependencies
├── package.json        # Node dependencies (root)
└── docker-compose.yml  # Multi-service orchestration
```

---

## Environment Variables

### Root `.env`
```bash
# API Configuration
STRAPI_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your_generated_token

# GitHub Integration (for issue creation)
GITHUB_TOKEN=your_github_token

# Printavo API (for data extraction)
PRINTAVO_EMAIL=your@email.com
PRINTAVO_TOKEN=your_printavo_token
```

### `services/api/.env`
See `services/api/.env.example`

### `services/customer-service-ai/.env`
See `services/customer-service-ai/.env.example`

---

## First Run Checklist

- [ ] Clone repository
- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Install Node dependencies: `npm install` (in services/api)
- [ ] Set up `.env` files with credentials
- [ ] Start PostgreSQL database
- [ ] Run Strapi: `npm run develop`
- [ ] Generate API token in Strapi admin
- [ ] Test API: `curl http://localhost:1337/api/customers`
- [ ] Start Botpress service
- [ ] Run test suite: `pytest tests/`

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 1337
lsof -i :1337

# Kill the process
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check credentials in .env match your setup
cat services/api/.env | grep DATABASE
```

### Python Import Errors
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Check Python path
which python
```

### Strapi Won't Start
```bash
# Clear cache and rebuild
cd services/api
rm -rf dist .cache
npm run build
npm run develop
```

---

## Common Tasks

### Generate API Token
1. Go to http://localhost:1337/admin
2. Login with your admin credentials
3. Settings → API Tokens → Create New
4. Copy and save the token to your `.env`

### Run Tests
```bash
pytest tests/
pytest tests/ -v  # Verbose
pytest tests/ --cov=services  # With coverage
```

### Run Data Extraction
```bash
python services/metadata-extraction/scrape_image_urls.py
```

### Check Service Status
```bash
docker-compose ps
```

### View Service Logs
```bash
docker-compose logs api
docker-compose logs botpress
docker-compose logs -f metadata
```

---

## Next Steps

1. ✅ Complete setup above
2. Read [CONTRIBUTING.md](../docs/CONTRIBUTING.md)
3. See [Architecture Overview](SERVICES_ARCHITECTURE.md)
4. Deploy to Homelab: [Deployment Guide](../docs/deployment/homelab-setup.md)

---

## Support

For issues or questions:
- Check [GitHub Issues](https://github.com/hypnotizedent/printshop-os/issues)
- See documentation in `/docs`
- Review [Contributing Guide](../docs/CONTRIBUTING.md)
