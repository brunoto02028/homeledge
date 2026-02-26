<p align="center">
  <img src="public/icon-192x192.png" alt="HomeLedger" width="80" height="80" />
</p>

<h1 align="center">HomeLedger</h1>

<p align="center">
  <strong>UK Household Finance SaaS Platform</strong><br/>
  Open Banking &bull; HMRC Reporting &bull; AI Categorisation &bull; Identity Verification &bull; Accounting Academy
</p>

<p align="center">
  <a href="https://homeledger.co.uk"><strong>homeledger.co.uk</strong></a>
</p>

<p align="center">
  <a href="https://homeledger.co.uk">
    <img src="https://img.shields.io/badge/Live-homeledger.co.uk-brightgreen?style=for-the-badge" alt="Live" />
  </a>
  <img src="https://img.shields.io/badge/Version-2.1.0-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/License-BSL_1.1-orange?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6.7-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.3-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe" alt="Stripe" />
  <img src="https://img.shields.io/badge/UK_GDPR-Compliant-green" alt="GDPR" />
  <img src="https://img.shields.io/badge/HMRC-Integrated-red" alt="HMRC" />
</p>

<p align="center">
  <a href="https://homeledger.co.uk">Live Platform</a> &bull;
  <a href="https://homeledger.co.uk/#pricing">Pricing</a> &bull;
  <a href="docs/architecture.md">Architecture</a> &bull;
  <a href="docs/api-reference.md">API Reference</a> &bull;
  <a href="CONTRIBUTING.md">Contributing</a> &bull;
  <a href="CHANGELOG.md">Changelog</a>
</p>

---

## What is HomeLedger?

HomeLedger is a **commercial SaaS platform** for UK household finance management. It serves individuals, households, sole traders, and limited companies with bank syncing, AI-powered transaction categorisation, HMRC-compliant tax reporting, certified identity verification, and professional accounting education.

### Business Model

| | |
|---|---|
| **Type** | B2C / B2B SaaS Platform |
| **Revenue** | Subscription plans (Free / Pro / Business) + Service commerce + IDV pay-per-use |
| **Target Market** | UK households, sole traders, small businesses, accountants |
| **Compliance** | UK GDPR, PECR, HMRC MTD, Companies House, OISC |
| **Live URL** | [homeledger.co.uk](https://homeledger.co.uk) |

### Pricing Tiers

| Plan | Price | Includes |
|------|-------|---------|
| **Free** | £0/mo | 1 entity, manual uploads, basic categorisation, academy access |
| **Pro** | £9.99/mo | 3 entities, Open Banking sync, HMRC reports, AI assistant |
| **Business** | £24.99/mo | Unlimited entities, Companies House filing, priority support, full API |
| **IDV** | Pay-per-use | Identity verification checks from £1.50/check |

### Key Pillars

| Pillar | Description |
|--------|-------------|
| **Finance & HMRC** | Open Banking sync, AI categorisation, SA100/CT600 reports, tax timeline |
| **Identity Verification** | Yoti-certified KYC/IDV, Right to Work/Rent checks, public verification links |
| **Accounting Academy** | AAT Level 2 → ACCA Level 6 roadmap, timed/study exam engine, AI tutor |
| **Relocation Hub** | OISC-compliant AI chat for UK immigration admin guidance |
| **Service Commerce** | Professional services storefront with Stripe payment processing |

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

### Identity Verification (IDV-as-a-Service)
- **Yoti-Certified** — DIATF-compliant digital identity verification
- **Right to Work / Right to Rent** — Employer and landlord compliance checks
- **Public Verification Links** — Send verification requests without requiring a HomeLedger account
- **QR Code Handoff** — Desktop-to-mobile seamless flow
- **Pay-Per-Use** — IDV packages from £1.50/check, no subscription required

### Service Commerce
- **6 Service Packages** — NIN registration, bank setup, company formation, tax filing, visa admin, relocation pack
- **Purchase Tracking** — Status pipeline: Pending → Paid → In Progress → Delivered
- **Stripe Payments** — Integrated payment processing with webhook handling

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
| **Identity** | Yoti IDV (DIATF-certified) |
| **Payments** | Stripe (subscriptions + one-off) |
| **Storage** | AWS S3 (documents, files) |
| **Email** | Nodemailer |
| **Charts** | Recharts, Chart.js, Plotly |
| **State** | Zustand, Jotai, React Query |
| **Testing** | Vitest + Puppeteer E2E |
| **CI/CD** | GitHub Actions (daily health checks) |
| **Deployment** | VPS (Ubuntu), PM2, Nginx, Let's Encrypt |

---

## Project Structure

```
homeledger/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # PR quality checks + build
│   │   └── daily-tests.yml     # Daily health check (auto-issue on failure)
│   ├── dependabot.yml          # Automated dependency updates
│   └── FUNDING.yml             # Sponsorship / commercial links
├── app/                        # Next.js App Router pages
│   ├── academy/                # Accounting Academy + Exam Engine
│   ├── admin/                  # Admin panel (CMS, users, analytics, compliance)
│   ├── api/                    # 40+ API routes
│   │   ├── academy/            # Course, exam, question endpoints
│   │   ├── ai/                 # AI chat + omni-AI endpoint
│   │   ├── analytics/          # Site analytics (collect + dashboard)
│   │   ├── cron/               # Scheduled tasks (bank sync 3x/day)
│   │   ├── government/         # HMRC + Companies House APIs
│   │   ├── open-banking/       # TrueLayer connect, sync, callback
│   │   ├── services/           # Service packages + purchases
│   │   ├── statements/         # Bank statements + transactions
│   │   └── yoti/               # Identity verification
│   ├── dashboard/              # Main dashboard
│   ├── relocation/             # Immigration Relocation Hub
│   ├── reports/                # HMRC/CH financial reports
│   ├── services/               # Service storefront + purchases
│   ├── verify/                 # Public IDV verification pages
│   └── ...                     # 30+ feature pages
├── components/                 # Shared React components (50+)
│   ├── ui/                     # shadcn/ui primitives
│   ├── cookie-banner.tsx       # GDPR consent (3-category)
│   ├── site-tracker.tsx        # First-party analytics
│   └── health-score.tsx        # Financial health widget
├── lib/                        # Core libraries
│   ├── ai-client.ts            # Gemini + Abacus AI client
│   ├── categorization-engine.ts # 4-layer categorisation
│   ├── government-api.ts       # HMRC + CH API client
│   ├── open-banking-sync.ts    # TrueLayer sync logic
│   ├── permissions.ts          # RBAC permission system
│   ├── vault-crypto.ts         # AES-256-GCM encryption
│   └── yoti-client.ts          # Yoti IDV SDK client
├── prisma/
│   ├── schema.prisma           # Database schema (55+ models)
│   ├── seed-academy.ts         # Academy seed data
│   ├── seed-cms.ts             # CMS content seed (15 sections)
│   └── seed-categorization-rules.ts  # 100 UK merchant rules
├── docs/                       # Documentation
│   ├── architecture.md         # System architecture
│   ├── api-reference.md        # API endpoint docs
│   ├── homeledger-complete-user-guide.md  # Full user guide
│   └── categorisation-intelligence-guide.md  # AI engine docs
├── __tests__/                  # Vitest unit tests
├── e2e/                        # End-to-end tests (Puppeteer)
├── messages/                   # i18n translations (en, pt-BR)
└── public/                     # Static assets + PWA manifest
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
npm test                           # Vitest unit tests
npm run test:coverage              # Coverage report
npm run test:health                # API route health checks
npm run test:daily                 # Full pipeline: type-check + lint + test + build
npx tsx e2e/auth.test.ts           # End-to-end auth tests (Puppeteer)
```

---

## Compliance & Security

| Standard | Implementation |
|----------|---------------|
| **UK GDPR** | Cookie consent banner, data minimisation, right to erasure, privacy policy |
| **PECR** | Granular cookie consent (essential/functional/analytics), opt-in analytics |
| **HMRC MTD** | SA100/SA103/CT600 report generation, tax timeline with deadlines |
| **Companies House** | OAuth 2.0 filing, confirmation statements, registered office changes |
| **OISC** | Legal disclaimer on all immigration guidance (Immigration and Asylum Act 1999) |
| **PCI DSS** | Stripe handles all card data — no card numbers stored |
| **DIATF** | Yoti-certified identity verification for Right to Work/Rent |

### Security Features
- AES-256-GCM encrypted vault for credentials
- RBAC with feature-level permissions per plan
- CSRF protection, rate limiting, input validation (Zod)
- SQL injection prevention via Prisma ORM
- HTTPS enforced via Nginx + Let's Encrypt
- Dependabot for automated dependency updates
- Daily automated health checks via GitHub Actions

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

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

This project is licensed under the **Business Source License 1.1** (BSL) — see [LICENSE](LICENSE) for details.

The BSL allows non-commercial and educational use. Commercial use requires a separate licence. The code converts to MIT after the Change Date (2030-02-26).

For commercial licensing enquiries: **hello@homeledger.co.uk**

---

## Acknowledgements

- [Next.js](https://nextjs.org/) — React framework
- [Prisma](https://prisma.io/) — Database ORM
- [TrueLayer](https://truelayer.com/) — Open Banking API
- [Stripe](https://stripe.com/) — Payment processing
- [Yoti](https://www.yoti.com/) — Identity verification
- [Gemini](https://ai.google.dev/) — AI language model
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [AAT](https://www.aat.org.uk/) — UK accounting qualification framework
- [ACCA](https://www.accaglobal.com/) — Chartered accountancy body

---

<p align="center">
  Built with care in the UK by <strong>Bruno Martins</strong><br/>
  <a href="https://homeledger.co.uk">homeledger.co.uk</a>
</p>
