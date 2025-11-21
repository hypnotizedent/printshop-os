# PrintShop OS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: In Development](https://img.shields.io/badge/Status-In%20Development-blue.svg)]()
[![Version: 0.1.0-alpha](https://img.shields.io/badge/Version-0.1.0--alpha-orange.svg)]()
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](.github/PULL_REQUEST_TEMPLATE.md)

> A mission-critical business operating system for apparel print shops, orchestrating production workflows, customer interactions, and operational efficiency through a modern, integrated software architecture.

---

## 🎯 Vision

PrintShop OS is designed to be the central nervous system for print shop operations, connecting order intake, production management, and business operations in a seamless, automated workflow. Built with scalability, reliability, and disaster recovery in mind, this system aims to eliminate manual processes and enable real-time operational visibility.

**Development Timeline:** 60 days to Level 1 MVP  
**Architecture:** Multi-component microservices with centralized data management  
**Deployment:** Docker-based, multi-server capable with full disaster recovery support

---

## 🏗️ System Architecture

PrintShop OS consists of three main components working together in a coordinated architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PrintShop OS Ecosystem                       │
└─────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────┐
                        │   CUSTOMERS      │
                        │  (Order Intake)  │
                        └────────┬─────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │      BOTPRESS          │
                    │  (Conversational AI)   │
                    │  - Order Collection    │
                    │  - Customer Interface  │
                    │  - Auto-responses      │
                    └───────────┬────────────┘
                                │
                                │ API Calls
                                │
            ┌───────────────────▼─────────────────────┐
            │          STRAPI (Central Hub)           │
            │       Headless CMS / Database API       │
            │                                         │
            │  ┌─────────────────────────────────┐  │
            │  │  Data Models:                   │  │
            │  │  • Jobs & Orders                │  │
            │  │  • Customers                    │  │
            │  │  • Employees & Time Tracking    │  │
            │  │  • Inventory (Future)           │  │
            │  │  • Invoicing (Future)           │  │
            │  └─────────────────────────────────┘  │
            │                                         │
            │  • RESTful API                         │
            │  • PostgreSQL Database                 │
            │  • Authentication & Permissions        │
            └───────────────┬─────────────────────────┘
                            │
                            │ API Integration
                            │
                ┌───────────▼────────────┐
                │      APPSMITH          │
                │ (Production Dashboard) │
                │                        │
                │  • Job Queue View      │
                │  • Job Details         │
                │  • Time Clock          │
                │  • Status Updates      │
                │  • Mobile Optimized    │
                └────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PRODUCTION  │
                    │     TEAM     │
                    └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Infrastructure Layer: Docker, PostgreSQL, Redis, MongoDB           │
│  Deployment: Multi-server, Load-balanced, Disaster Recovery Ready   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 🎨 **Strapi** - Central API & Database
The heart of the system, managing all data and providing RESTful APIs.
- **Purpose:** Central data repository and API gateway
- **Technology:** Node.js-based Headless CMS
- **Database:** PostgreSQL (production), SQLite (development)
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 1 Guide](docs/phases/phase-1-strapi.md)

#### 📊 **Appsmith** - Internal Production Dashboard
Mobile-optimized interface for production team to manage jobs and track time.
- **Purpose:** Internal operations dashboard
- **Technology:** Low-code application builder
- **Features:** Job management, time clock, status updates
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 2 Guide](docs/phases/phase-2-appsmith.md)

#### 💬 **Botpress** - Customer Order Intake
Conversational AI interface for automated customer order collection.
- **Purpose:** Customer-facing order intake automation
- **Technology:** Conversational AI platform
- **Features:** Order collection, customer communication, API integration
- **Repository:** Separate repository (to be created)
- **Documentation:** [Phase 3 Guide](docs/phases/phase-3-botpress.md)

---

## 🚀 Technology Stack

### Core Technologies
- **Backend/API:** Strapi 4.x (Node.js 18+)
- **Database:** PostgreSQL 15+ (Production), SQLite 3 (Development)
- **Frontend Dashboard:** Appsmith (Latest)
- **Conversational AI:** Botpress 12.x+
- **Caching:** Redis 7+
- **Document Store:** MongoDB 6+ (for Appsmith)

### Infrastructure
- **Containerization:** Docker 24+, Docker Compose 2.x
- **Reverse Proxy:** Nginx (Optional)
- **Version Control:** Git
- **Deployment:** Multi-server capable with Docker Swarm or Kubernetes (future)

### Development Tools
- **Package Manager:** npm/yarn
- **Environment Management:** dotenv
- **API Testing:** Postman, Thunder Client
- **Monitoring:** Docker health checks, logs

---

## ⚡ Quick Start

### Prerequisites
- **Docker & Docker Compose:** Required for local development
- **Node.js 18+:** For local Strapi development
- **Git:** For version control
- **8GB RAM minimum:** 16GB recommended
- **20GB disk space:** For all containers and data

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/hypnotizedent/printshop-os.git
cd printshop-os

# Copy environment template
cp .env.example .env

# Edit .env with your configurations
nano .env  # or use your preferred editor
```

### 2. Start the System

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 3. Access the Components

After startup (allow 2-3 minutes for initialization):

- **Strapi Admin:** http://localhost:1337/admin
- **Strapi API:** http://localhost:1337/api
- **Appsmith Dashboard:** http://localhost:8080
- **Botpress Studio:** http://localhost:3000

### 4. Initial Configuration

1. **Strapi:** Create admin account on first access
2. **Appsmith:** Create workspace and connect to Strapi API
3. **Botpress:** Import conversation flows

📚 **Detailed Setup:** See [Docker Setup Guide](docs/deployment/docker-setup.md)

---

## 📁 Repository Structure

```
printshop-os/
├── .github/                    # GitHub templates and workflows
│   ├── ISSUE_TEMPLATE/        # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                       # Comprehensive documentation
│   ├── architecture/          # System architecture docs
│   ├── phases/                # Implementation phase guides
│   ├── deployment/            # Deployment and operations
│   ├── api/                   # API documentation
│   └── CONTRIBUTING.md        # Contribution guidelines
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── docker-compose.yml         # Local development orchestration
├── CHANGELOG.md               # Version history
├── LICENSE                    # MIT License
├── README.md                  # This file
├── ROADMAP.md                 # Technical roadmap
└── SECURITY.md                # Security policy
```

### Component Repositories
Each component will have its own dedicated repository:
- `printshop-strapi` - Strapi configuration and customizations
- `printshop-appsmith` - Appsmith application exports
- `printshop-botpress` - Botpress bot configurations and flows

---

## 📖 Documentation

### Architecture & Design
- [System Overview](docs/architecture/system-overview.md) - High-level architecture
- [Data Flow](docs/architecture/data-flow.md) - Data flow and API patterns
- [Component Architecture](docs/architecture/component-architecture.md) - Detailed component breakdown

### Implementation Guides
- [Phase 1: Strapi Setup](docs/phases/phase-1-strapi.md) - Central API and database
- [Phase 2: Appsmith Dashboard](docs/phases/phase-2-appsmith.md) - Production interface
- [Phase 3: Botpress Integration](docs/phases/phase-3-botpress.md) - Customer intake bot

### Deployment & Operations
- [Docker Setup](docs/deployment/docker-setup.md) - Container orchestration
- [Environment Variables](docs/deployment/environment-variables.md) - Configuration guide
- [Disaster Recovery](docs/deployment/disaster-recovery.md) - Backup and recovery procedures

### API Reference
- [Strapi Endpoints](docs/api/strapi-endpoints.md) - Complete API reference
- [Integration Guide](docs/api/integration-guide.md) - Integration patterns

### Contributing
- [Contributing Guidelines](docs/CONTRIBUTING.md) - Development workflow and standards

---

## 🛣️ Roadmap

### Level 1 MVP (Current - 60 Day Timeline)
- ✅ Repository structure and documentation
- 🔄 Phase 1: Strapi central database (In Progress)
- ⏳ Phase 2: Appsmith production dashboard
- ⏳ Phase 3: Botpress order intake

### Future Modules
- **Finance Module:** Invoicing, payments, accounting integration
- **Marketing Module:** Email campaigns, customer analytics
- **Sales Module:** CRM, quotes, order tracking
- **Inventory Module:** Stock management, supplier integration
- **Reporting Module:** Business intelligence, analytics dashboards
- **Mobile Apps:** Native iOS/Android applications

---

## 🤝 Contributing

We welcome contributions! This project is being developed with AI assistance and is designed to be AI-friendly.

Please read our [Contributing Guidelines](docs/CONTRIBUTING.md) for:
- Development workflow
- Coding standards
- Commit message conventions
- Pull request process

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🔒 Security

Security is paramount for business-critical systems. 

- **Report vulnerabilities:** See [SECURITY.md](SECURITY.md)
- **Security best practices:** Documented in deployment guides
- **Regular updates:** Dependencies monitored and updated
- **Data protection:** Encryption at rest and in transit

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

### Getting Help
- 📖 **Documentation:** Check the `/docs` folder first
- 💬 **Discussions:** Use GitHub Discussions for questions
- 🐛 **Bug Reports:** Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ **Feature Requests:** Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md)
- ❓ **Questions:** Use the [Question template](.github/ISSUE_TEMPLATE/question.md)

### Links
- **Project Repository:** https://github.com/hypnotizedent/printshop-os
- **Issue Tracker:** https://github.com/hypnotizedent/printshop-os/issues
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- **Roadmap:** [ROADMAP.md](ROADMAP.md)

---

## 🙏 Acknowledgments

Built with modern open-source technologies:
- [Strapi](https://strapi.io/) - Open-source headless CMS
- [Appsmith](https://www.appsmith.com/) - Low-code application platform
- [Botpress](https://botpress.com/) - Conversational AI platform
- [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database
- [Docker](https://www.docker.com/) - Container platform

---

<div align="center">

**Built for print shops, by print shop professionals, with AI assistance**

[Get Started](docs/phases/phase-1-strapi.md) | [Documentation](docs/) | [Contribute](docs/CONTRIBUTING.md)

</div>
