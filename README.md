<p align="center">
  <img src="public/icon-192x192.png" alt="HomeLedger" width="80" height="80" />
</p>

<h1 align="center">HomeLedger</h1>

<p align="center">
  <strong>The all-in-one UK household finance platform</strong><br/>
  Bank syncing &bull; HMRC reporting &bull; AI categorisation &bull; Accounting academy &bull; Immigration support
</p>

<p align="center">
  <a href="https://homeledger.co.uk">Live Demo</a> &bull;
  <a href="docs/architecture.md">Architecture</a> &bull;
  <a href="docs/api-reference.md">API Reference</a> &bull;
  <a href="CONTRIBUTING.md">Contributing</a> &bull;
  <a href="CHANGELOG.md">Changelog</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.7-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## Overview

HomeLedger is a comprehensive UK financial management SaaS platform built for individuals, households, sole traders, and limited companies. It connects to UK banks via Open Banking (TrueLayer), categorises transactions using a 4-layer AI engine, generates HMRC-compliant reports, and now includes an **Accounting Academy**, **Immigrant Relocation Hub**, and **Service Commerce** system.

### Key Pillars

| Pillar | Description |
|--------|-------------|
| **Finance & HMRC** | Bank syncing, statement processing, AI categorisation, SA100/CT600 reports, tax timeline |
| **Accounting Academy** | AAT Level 2 → ACCA Level 6 roadmap, timed/study exam engine, AI tutor |
| **Relocation Hub** | OISC-compliant AI chat for UK immigration admin guidance |
| **Service Commerce** | Professional services storefront with purchase tracking |

---

## Features

### Financial Management
- **Open Banking** — TrueLayer integration, auto-sync 3x daily, 24-month history on connect
- **AI Categorisation** — 4-layer engine: deterministic rules → pattern matching → AI classification → feedback loop
- **3 Categorisation Modes** — Conservative, Smart (default), Autonomous
- **HMRC Reports** — SA100/SA103 box mapping, CT600 for companies, P&L statements
- **Companies House** — Filing support, company profile sync, officer management
- **Multi-Entity** — Sole traders, limited companies, partnerships, LLPs
- **Bills & Invoices** — AI-powered document scanning (Docling + Gemini)
- **Secure Vault** — AES-256-GCM encrypted credential storage
- **Financial Health Score** — 6-component score with actionable insights
- **Tax Timeline** — Visual HMRC deadline tracker (SA, VAT, CT, PAYE)
- **Budget Alerts** — Real-time notifications when budgets are exceeded
- **PWA** — Installable progressive web app with offline support

### Accounting Academy
- **Visual Roadmap** — 5 qualification levels with HMRC/CH permissions unlocked at each stage
- **22 Exam Modules** — From bookkeeping basics to chartered-level strategic reporting
- **Exam Engine** — Timed mode (countdown, anti-cheat, shuffled questions) and Study mode (explanations, AI tutor)
- **AI Tutor** — Context-aware Gemini/Abacus AI that explains concepts, worked examples, common mistakes
- **Career Paths** — Salary ranges, qualification titles, career progression at each level

### Relocation Hub
- **AI Chat** — Immigration admin guidance powered by Gemini AI
- **OISC Compliance** — Legal disclaimer on every response per Immigration and Asylum Act 1999
- **Quick Topics** — NIN, bank account, GP/NHS, council tax, renting, driving licence, etc.
- **GOV.UK Links** — Direct links to official resources

### Service Commerce
- **6 Service Packages** — NIN registration, bank setup, company formation, tax filing, visa admin, relocation pack
- **Purchase Tracking** — Status pipeline: Pending → Paid → In Progress → Delivered
- **Stripe-Ready** — Payment integration placeholder (manual tracking currently)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.2 |
| **Database** | PostgreSQL 16 + Prisma 6.7 ORM |
| **Auth** | NextAuth.js 4.24 (email + magic link) |
| **Styling** | Tailwind CSS 3.3 + shadcn/ui (Radix primitives) |
| **AI** | Gemini 2.0 Flash (primary) + Abacus AI (fallback) |
| **Banking** | TrueLayer Open Banking API |
| **Government** | HMRC API + Companies House API (OAuth 2.0) |
| **Documents** | Docling microservice (Python/FastAPI) + PDF-lib |
| **Identity** | Yoti IDV (sandbox) |
| **Storage** | AWS S3 (documents, files) |
| **Email** | Nodemailer |
| **Charts** | Recharts, Chart.js, Plotly |
| **State** | Zustand, Jotai, React Query |
| **Deployment** | VPS (Ubuntu), PM2, Nginx, Let's Encrypt |

---

## Project Structure

```
homeledger/
├── app/                    # Next.js App Router pages
│   ├── academy/            # Accounting Academy + Exam Engine
│   ├── admin/              # Admin panel (CMS, users, compliance)
│   ├── api/                # API routes
│   │   ├── academy/        # Course, exam, question endpoints
│   │   ├── ai/             # AI chat + omni-AI endpoint
│   │   ├── categories/     # Category CRUD
│   │   ├── cron/           # Scheduled tasks (bank sync)
│   │   ├── government/     # HMRC + Companies House APIs
│   │   ├── invoices/       # Invoice processing + AI extraction
│   │   ├── open-banking/   # TrueLayer connect, sync, callback
│   │   ├── services/       # Service packages + purchases
│   │   ├── statements/     # Bank statements + transactions
│   │   └── yoti/           # Identity verification
│   ├── dashboard/          # Main dashboard
│   ├── learn/              # Guides, glossary, AI Q&A
│   ├── relocation/         # Immigration Relocation Hub
│   ├── reports/            # HMRC/CH financial reports
│   ├── services/           # Service storefront + purchases
│   └── ...                 # 20+ other feature pages
├── components/             # Shared React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── navigation.tsx      # Sidebar navigation
│   ├── ai-chat.tsx         # Floating AI chat bubble
│   └── health-score.tsx    # Financial health widget
├── lib/                    # Core libraries
│   ├── ai-client.ts        # Gemini + Abacus AI client
│   ├── categorization-engine.ts  # 4-layer categorisation
│   ├── government-api.ts   # HMRC + CH API client
│   ├── open-banking-sync.ts # TrueLayer sync logic
│   ├── permissions.ts      # RBAC permission system
│   └── vault-crypto.ts     # AES-256-GCM encryption
├── prisma/
│   ├── schema.prisma       # Database schema (50+ models)
│   ├── seed-academy.ts     # Academy seed data
│   └── seed-categorization-rules.ts  # 100 UK merchant rules
├── docs/                   # Documentation
│   ├── architecture.md     # System architecture
│   └── api-reference.md    # API endpoint documentation
├── e2e/                    # End-to-end tests
│   └── auth.test.ts        # Auth flow tests (14 tests)
├── messages/               # i18n translations (en, pt-BR)
└── public/                 # Static assets + PWA manifest
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20 LTS)
- **PostgreSQL** 14+ running locally or remotely
- **npm** 9+ or **pnpm**

### Installation

```bash
# Clone the repository
git clone https://github.com/brunoto02028/homeledge.git
cd homeledge

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, API keys, etc.

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial data
npx tsx prisma/seed-academy.ts
npx tsx prisma/seed-categorization-rules.ts

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file with the following (see `.env.example` for full list):

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/homeledger"

# Auth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI (at least one required)
GEMINI_API_KEY="your-gemini-api-key"
ABACUSAI_API_KEY="your-abacus-api-key"

# Open Banking (optional)
TRUELAYER_CLIENT_ID=""
TRUELAYER_CLIENT_SECRET=""
TRUELAYER_REDIRECT_URI=""

# Government APIs (optional)
CH_API_KEY=""
HMRC_CLIENT_ID=""
HMRC_CLIENT_SECRET=""

# S3 Storage (optional)
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
AWS_REGION=""

# Email (optional)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
```

---

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
npm run format     # Prettier formatting
npm run type-check # TypeScript type checking
npm run audit      # Security audit
```

---

## Deployment

HomeLedger runs on a VPS with the following stack:

```
Ubuntu 22.04 → Nginx (reverse proxy + SSL) → PM2 → Next.js (port 3100)
                                            → PM2 → Docling (port 3200)
```

### Deploy steps

```bash
ssh root@your-server
cd /opt/homeledger
# Upload new files via scp or git
npx prisma db push
npx prisma generate
npm run build
pm2 restart homeledger
```

---

## Testing

```bash
# End-to-end auth tests (Puppeteer)
npx tsx e2e/auth.test.ts

# Lint check
npm run lint

# Type check
npx tsc --noEmit
```

---

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full system architecture, including:
- Data flow diagrams
- AI categorisation pipeline
- Open Banking sync architecture
- Permission and role system
- Multi-entity model

## API Reference

See [docs/api-reference.md](docs/api-reference.md) for the complete API documentation with request/response examples.

---

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:
- Setting up your development environment
- Code style and conventions
- Submitting pull requests
- Reporting issues

---

## Security

For security concerns, please see [SECURITY.md](SECURITY.md). Do **not** open public issues for security vulnerabilities.

---

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Next.js](https://nextjs.org/) — React framework
- [Prisma](https://prisma.io/) — Database ORM
- [TrueLayer](https://truelayer.com/) — Open Banking API
- [Gemini](https://ai.google.dev/) — AI language model
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [AAT](https://www.aat.org.uk/) — UK accounting qualification framework
- [ACCA](https://www.accaglobal.com/) — Chartered accountancy body

---

<p align="center">
  Built with care in the UK by <strong>Bruno Martins</strong><br/>
  <a href="https://homeledger.co.uk">homeledger.co.uk</a>
</p>
