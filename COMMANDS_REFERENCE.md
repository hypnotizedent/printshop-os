# 🚀 PrintShop OS - Quick Commands Reference

## Frontend Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Type checking
npm run type-check
```

## Docker & Deployment

```bash
# Start all services (including frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Remove all data
docker-compose down -v

# Build frontend Docker image
docker build -t printshop-frontend:latest ./frontend

# Run frontend container
docker run -p 3000:3000 printshop-frontend:latest

# Push to registry
docker build -t your-registry/printshop-frontend:latest ./frontend
docker push your-registry/printshop-frontend:latest
```

## Service Access

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 (Docker) | Customer portal & management UI |
| Frontend Dev | http://localhost:5173 (npm dev) | Development server |
| Strapi Admin | http://localhost:1337/admin | CMS admin panel |
| Strapi API | http://localhost:1337/api | REST API |
| Appsmith | http://localhost:8080 | Production dashboard |
| Botpress | http://localhost:3000 | Conversational AI |

## Git Workflow

```bash
# Check frontend changes
cd frontend
git status

# View git log
git log --oneline | head -10

# Create new branch
git checkout -b feature/my-feature

# Stage changes
git add .

# Commit
git commit -m "feat: description of changes"

# Push
git push origin main
```

## Troubleshooting

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Kill process on port 5173 (dev server)
lsof -ti:5173 | xargs kill -9

# Check if services are running
docker-compose ps

# View environment
cd frontend
cat .env.local
```

## Documentation Files

| File | Purpose |
|------|---------|
| `frontend/README_FRONTEND.md` | Frontend setup & usage |
| `docs/FRONTEND_INTEGRATION_COMPLETE.md` | Integration summary |
| `docs/SPARK_FRONTEND_INTEGRATION.md` | Complete integration strategy |
| `docs/FRONTEND_INTEGRATION_STRATEGY.md` | Architecture & APIs |
| `README.md` | Main project README |

## Environment Variables

```bash
# Frontend Configuration
VITE_API_URL=http://localhost:3002          # Main API
VITE_STRAPI_URL=http://localhost:1337       # Strapi CMS
VITE_WS_URL=ws://localhost:3004             # WebSocket

# Features
VITE_ENABLE_CUSTOMER_PORTAL=true
VITE_ENABLE_ADVANCED_PRICING=true
VITE_ENABLE_SUPPLIER_SYNC=true
VITE_ENABLE_ANALYTICS=true

# Build
VITE_BUILD_TARGET=es2020
VITE_SOURCEMAP=false
```

## Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# List npm scripts
npm run

# View package size
npm list

# Update dependencies
npm update

# Find security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Project Structure Quick Reference

```
printshop-os/
├── frontend/                    ← Your React UI
├── services/
│   ├── api/                     ← Business logic APIs
│   ├── job-estimator/           ← Pricing engine
│   └── supplier-sync/           ← Data sync services
├── docs/                        ← Documentation
├── docker-compose.yml           ← Docker services
├── .env.example                 ← Environment template
└── README.md                    ← Main docs
```

## Commit Message Convention

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Code style changes
refactor: Refactor code
test: Add tests
chore: Maintenance tasks
```

## Useful Links

- Frontend Repo: https://github.com/hypnotizedent/printshop-os
- Issue Tracker: https://github.com/hypnotizedent/printshop-os/issues
- PR Dashboard: https://github.com/hypnotizedent/printshop-os/pulls
- GitHub Actions: https://github.com/hypnotizedent/printshop-os/actions

## Performance Monitoring

```bash
# Check build size
npm run build
# Look for dist/ size in output

# Analyze dependencies
npm list --depth=0

# Check for unused packages
npm audit
```

---

**Note:** For detailed information, see the documentation files listed above.
