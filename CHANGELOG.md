# Changelog

All notable changes to HomeLedger are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/).

---

## [2.0.0] — 2026-02-25

### Added — Accounting Academy
- Visual roadmap: AAT Level 2 → ACCA Level 6 with HMRC/CH permissions at each stage
- 22 exam modules with learning outcomes, topics covered, and pass marks
- Exam Engine: timed mode (countdown, auto-submit, anti-cheat) and study mode (reveal answers, explanations)
- AI Tutor: context-aware Gemini AI for explaining accounting concepts during study
- Seed data: 5 levels, 22 modules, 8 sample questions (Level 2 Bookkeeping Transactions)
- API routes: `/api/academy/courses`, `/api/academy/modules/[id]/questions`, `/api/academy/exam`, `/api/academy/exam/submit`

### Added — Immigrant Relocation Hub
- AI-powered chat with OISC compliance disclaimer (Immigration and Asylum Act 1999)
- 10 quick topic buttons: NIN, bank account, GP, council tax, renting, driving, etc.
- Conversation history support, useful GOV.UK links sidebar
- Context-aware AI endpoint: `/api/ai/ask` with accounting/immigration/finance personas

### Added — Service Commerce
- 6 service packages: NIN registration, bank setup, company formation, SA filing, visa admin, relocation pack
- Purchase tracking dashboard: Pending → Paid → In Progress → Delivered
- API routes: `/api/services`, `/api/services/purchases`
- Stripe-ready payment placeholder

### Added — Project Quality
- README.md with full documentation, tech stack, installation guide
- LICENSE (MIT), CONTRIBUTING.md, CHANGELOG.md, SECURITY.md
- ESLint + Prettier configuration
- GitHub Actions CI/CD pipeline
- Dependabot configuration for automated dependency updates
- `/docs` folder with architecture and API reference documentation

### Changed
- Navigation: added Academy, Relocation Hub, Services sidebar items
- Permissions: `academy`, `relocation`, `services` added to all plans (including free)
- i18n: English and Portuguese translations updated
- Learn page icon changed from GraduationCap to BookOpen

---

## [1.9.0] — 2026-02-25

### Added — Entity History & Documents
- EntityHistory model with 10 event types (note, correspondence, filing, etc.)
- Timeline view in entity detail page with type-coloured icons
- CRUD API: `/api/entities/[id]/history`

### Changed
- Connections removed from sidebar (consolidated into entity Actions tab)
- Companies House OAuth callback redirects to entity detail page

---

## [1.8.0] — 2026-02-24

### Added — Yoti IDV v2
- Official Yoti SDK integration with sandbox mode
- QR code for desktop → mobile handoff
- Public verification links (no HomeLedger account required)
- Admin verification link management in compliance dashboard

---

## [1.7.0] — 2026-02-23

### Added — Government API Integration
- Companies House: company profile, officers, filing history, registered office
- Companies House filing: change registered office, confirmation statement
- HMRC: SA obligations, tax calculation, VAT obligations/liabilities/payments
- OAuth 2.0 flows for both CH and HMRC
- GovernmentConnection and GovernmentFiling Prisma models

---

## [1.6.0] — 2026-02-22

### Added — 4-Layer Categorisation Engine
- Deterministic rules (100 UK merchant rules seeded)
- Smart pattern detection from correction history
- AI supervised classification (Gemini/Abacus) with confidence scoring
- Auto-learning feedback loop (3+ corrections → auto-rule)
- 3 modes: Conservative, Smart, Autonomous
- Smart Rules management page with metrics dashboard

---

## [1.5.0] — 2026-02-21

### Added — Entity-Aware Features
- Entity-type-aware categorisation (HMRC vs Companies House regimes)
- Entity filtering across statements, invoices, bills, reports
- Reports differentiation: SA103 for sole traders, CT600 for companies
- Dark mode fixes for all report cards

---

## [1.4.0] — 2026-02-20

### Added — Platform Features (Phases C-L)
- Entity linking across invoices, bills, documents
- Enhanced AI Chat with per-section live data context
- Vault AI-fill from scanned documents
- Life Events 2.0 (6 new event types including immigrating_to_uk)
- Reports PDF export for all report types
- Financial Health Score (6 components)
- PWA with service worker and install prompt
- Budget alerts with toast notifications
- Tax Timeline with HMRC deadlines
- Accountant Portal with shared links

---

## [1.3.0] — 2026-02-18

### Added — Open Banking Mirror Sync
- Full 24-month history sync on connect
- Incremental sync 3x daily via cron
- SCA handling with friendly reconnect flow
- Shared sync logic across callback, manual refresh, and cron

---

## [1.2.0] — 2026-02-16

### Added — Core Platform (9 Phases)
- Docling document processing microservice
- AI Chat (Abacus API) with floating bubble
- Secure Vault with AES-256-GCM encryption
- Financial Projections dashboard
- Puppeteer E2E tests (14 tests)
- UX review: personalised greetings, consistent loading states

---

## [1.0.0] — 2025-12-01

### Added — Initial Release
- Multi-entity household finance management
- Bank statement upload and AI processing
- Invoice and bill tracking
- Category management with HMRC tax mapping
- User authentication (NextAuth.js)
- Admin panel with CMS, user management
- Multi-language support (English, Portuguese)
