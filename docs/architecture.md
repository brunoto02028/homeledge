# HomeLedger — System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│   Browser (PWA) ─── Mobile (PWA) ─── Shared Links (Public)  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                    Nginx Reverse Proxy                        │
│              SSL (Let's Encrypt) + Gzip                      │
└────────┬───────────────────────────────────┬────────────────┘
         │ :3100                             │ :3200
┌────────▼──────────┐            ┌───────────▼──────────┐
│   Next.js 14      │            │   Docling Service    │
│   (App Router)    │            │   (Python/FastAPI)   │
│   PM2 managed     │◄──────────►│   PM2 managed        │
└────────┬──────────┘            └──────────────────────┘
         │
┌────────▼──────────────────────────────────────────────┐
│                    Prisma ORM (v6.7)                    │
└────────┬──────────────────────────────────────────────┘
         │
┌────────▼──────────┐
│   PostgreSQL 16   │
│   50+ tables      │
└───────────────────┘
```

---

## Core Modules

### 1. Authentication & Authorization

```
NextAuth.js (JWT mode)
├── Email + magic link login
├── Session management (30-day expiry)
├── Middleware route protection
└── RBAC: admin, accountant, user
    └── Feature permissions per user/plan
        ├── free: 8 features
        ├── starter: 16 features
        ├── pro: all features
        └── enterprise: all features
```

### 2. Multi-Entity Model

```
User (household owner)
├── Entity: "Bruno" (sole_trader) → HMRC regime
├── Entity: "Kingdom US Ltd" (limited_company) → Companies House regime
└── Entity: "Joint Account" (individual) → Universal regime

Each entity has:
├── Bank Connections (TrueLayer)
├── Bank Statements → Transactions
├── Invoices, Bills
├── Categories (regime-filtered)
├── Government Connections (CH, HMRC)
└── Entity History & Documents
```

### 3. Open Banking Sync (TrueLayer)

```
Connect Flow:
  User clicks "Connect Bank"
  → POST /api/open-banking/connect (creates BankConnection)
  → Redirect to TrueLayer OAuth
  → Callback: GET /api/open-banking/callback
    → Exchange code for tokens
    → Redirect user immediately (non-blocking)
    → Background: sync 24 months of history
    → Auto-categorise all transactions

Sync Modes:
  ├── On Connect: 24 months full history
  ├── Manual Refresh: incremental from lastSyncAt
  └── Cron (3x/day): incremental with 1-day buffer

Deduplication:
  └── By tlTransactionId within same entity's statements

Statement Structure:
  BankConnection → BankStatement (monthly) → BankTransaction[]
```

### 4. AI Categorisation Engine (4 Layers)

```
Transaction arrives
  │
  ▼
Layer 1: Deterministic Rules (100 seeded UK merchant rules)
  │ Match by keyword/regex/exact against description/merchant
  │ If match → return with confidence 1.0
  │
  ▼
Layer 2: Pattern Detection (from CategorizationFeedback history)
  │ ≥50% word overlap with past corrections
  │ Confidence scales with repetition count
  │
  ▼
Layer 3: AI Classification (Gemini primary, Abacus fallback)
  │ Batch processing with entity regime context
  │ Returns: category, confidence (0.0-1.0), justification
  │
  ▼
Layer 4: Feedback Loop
  │ Every manual correction → CategorizationFeedback
  │ After 3+ identical corrections → auto-creates CategorizationRule
  │
  ▼
3 Modes:
  ├── Conservative: everything needs manual review
  ├── Smart (default): auto-approve ≥90%, suggest 70-90%, review <70%
  └── Autonomous: AI governs, human audits exceptions
```

### 5. Accounting Academy

```
CourseLevel (5 levels: AAT L2-L4, ACCA L5-L6)
  └── ExamModule (22 modules total)
      └── Question + QuestionOption[]

Exam Engine:
  ├── Timed Mode:
  │   ├── Countdown timer → auto-submit
  │   ├── Questions shuffled + options shuffled
  │   ├── Correct answers hidden until submission
  │   └── Anti-cheat: tab switch detection
  │
  └── Study Mode:
      ├── Reveal answer per question
      ├── Per-option explanations
      ├── AI Explanation panel
      └── Integrated AI Tutor (ask anything)

Grading:
  POST /api/academy/exam/submit
  → Server-side grading (correct answers from DB)
  → Score %, pass/fail, graded answers stored as JSON
```

### 6. Relocation Hub

```
/api/ai/ask (context: 'immigration')
  ├── OISC compliance disclaimer prepended to every response
  ├── Topics: NIN, bank, GP, council tax, renting, driving, etc.
  ├── Redirects to OISC/solicitor for visa/asylum matters
  └── Conversation history support (last 10 messages)
```

### 7. Service Commerce

```
ServicePackage (6 packages)
  └── UserPurchase
      └── Status: pending → paid → in_progress → delivered

Future: Stripe Checkout integration
  POST /api/services/purchases → Create Stripe session → Redirect → Webhook confirms payment
```

---

## Database Schema (Key Models)

| Domain | Models |
|--------|--------|
| **Auth** | User, Account, Session, VerificationToken |
| **Entities** | Entity, EntityHistory |
| **Banking** | BankConnection, BankStatement, BankTransaction |
| **Finance** | Invoice, Bill, Category, Budget |
| **Categorisation** | CategorizationRule, CategorizationFeedback |
| **Government** | GovernmentConnection, GovernmentFiling |
| **Academy** | CourseLevel, ExamModule, Question, QuestionOption, UserExamAttempt |
| **Commerce** | ServicePackage, UserPurchase |
| **Security** | VaultEntry, VerificationLink |
| **Sharing** | SharedLink, HouseholdInvitation |

---

## AI Integration

```
callAI() — lib/ai-client.ts
  ├── Primary: Gemini 2.0 Flash (generativelanguage.googleapis.com)
  ├── Fallback: Abacus AI (apps.abacus.ai)
  ├── Timeout: 90 seconds
  └── Supports: system prompts, conversation history, temperature control

Contexts:
  ├── Transaction categorisation (temperature 0.2)
  ├── Document extraction (temperature 0.1)
  ├── Accounting tutor (temperature 0.2)
  ├── Immigration guide (temperature 0.4)
  └── General finance Q&A (temperature 0.7)
```

---

## Deployment Architecture

```
VPS (Ubuntu 22.04, 4GB RAM)
├── Nginx (reverse proxy)
│   ├── homeledger.co.uk → localhost:3100
│   └── SSL via Let's Encrypt (auto-renew)
├── PM2
│   ├── homeledger (Next.js, port 3100)
│   └── docling (Python/FastAPI, port 3200)
├── PostgreSQL 16 (localhost:5432)
└── Cron
    └── Bank sync: 06:00, 14:00, 22:00 UTC
```
