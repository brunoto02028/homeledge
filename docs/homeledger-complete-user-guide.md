# HomeLedger — Complete User Guide

> **Your finances, simplified.**
> HomeLedger is a UK-focused household finance management platform that helps individuals, sole traders, and limited companies organise their money, track expenses, generate HMRC-ready reports, and plan for the future.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard — Your Financial Overview](#2-dashboard)
3. [Household — Managing Your Family Finances](#3-household)
4. [Entities — Your Financial Identities](#4-entities)
5. [Statements — Bank Statement Management](#5-statements)
6. [Documents — Scanning & Processing](#6-documents)
7. [Invoices — Income Tracking](#7-invoices)
8. [Bills — Expense Tracking](#8-bills)
9. [Categories — Organising Your Transactions](#9-categories)
10. [Smart Rules — Categorisation Intelligence](#10-smart-rules)
11. [Providers — Open Banking & Bank Connections](#11-providers)
12. [Reports — Financial Reports & HMRC](#12-reports)
13. [Actions — Task Management](#13-actions)
14. [Files — Document Storage](#14-files)
15. [Vault — Secure Credential Storage](#15-vault)
16. [Projections — Financial Forecasting](#16-projections)
17. [Transfers — Account-to-Account Movements](#17-transfers)
18. [Properties — Property Portfolio](#18-properties)
19. [Product Calculator — Financial Products](#19-product-calculator)
20. [Tax Timeline — HMRC Deadlines](#20-tax-timeline)
21. [Life Events — Major Life Changes](#21-life-events)
22. [Learn — Financial Education](#22-learn)
23. [Academy — Accounting Qualifications](#23-academy)
24. [Relocation Hub — Moving to the UK](#24-relocation)
25. [Services — Professional Help](#25-services)
26. [Settings — Personalisation](#26-settings)
27. [AI Chat Assistant](#27-ai-chat)
28. [Sharing — Accountant Portal](#28-sharing)
29. [Tips & Best Practices](#29-tips)

---

## 1. Getting Started

### Creating Your Account

1. Go to [homeledger.co.uk](https://homeledger.co.uk)
2. Click **Register** and enter your name, email, and a strong password
3. Verify your email address
4. Log in and you'll land on your **Dashboard**

### First Steps (Recommended Order)

Follow this order to get the most out of HomeLedger:

```
Step 1: Create your Entity (who are you financially?)
Step 2: Set up your Categories (or use the defaults)
Step 3: Upload your first bank statement
Step 4: Review and correct any miscategorised transactions
Step 5: Explore your Reports
```

### Understanding the Sidebar

The sidebar on the left is your main navigation. It contains all the modules listed in this guide. You can:

- **Reorder items** — Click "Reorder", then drag items to your preferred order
- **Sort A-Z** — Click "A-Z" to sort alphabetically
- **Collapse sidebar** — Click the collapse arrow for more screen space
- **Switch language** — Toggle between English and Portuguese at the bottom

### Switching Entities

If you manage multiple financial identities (e.g. personal + business), use the **Entity Selector** at the top of the sidebar to switch between them. All data (statements, reports, categories) is filtered by the selected entity.

---

## 2. Dashboard

**What it is:** Your financial command centre. A single page showing the big picture.

**What you'll see:**

- **Personalised greeting** — "Good morning, Bruno" (adapts to time of day)
- **Financial Health Score** — A percentage showing how well-organised your finances are, based on 6 components:
  - Bill tracking (are bills up to date?)
  - Categorisation (% of transactions categorised)
  - Actions (pending tasks completed?)
  - Savings rate (are you saving?)
  - Budget planning (are budgets set?)
  - Data freshness (how recent is your data?)
- **Budget Alerts** — Toast notifications if any budget is over or near its limit
- **Quick Stats** — Total income, expenses, net position
- **Recent Activity** — Latest transactions and actions

**How to use it:** Check your Dashboard daily or weekly for a quick health check. If the health score drops, click into the specific area that needs attention.

---

## 3. Household

**What it is:** Manage the people in your household and invite family members to collaborate.

**What you can do:**

- **View household members** — See who has access to the account
- **Invite members** — Send email invitations to family members
- **Set permissions** — Control what each member can see and do
- **Manage roles** — Assign roles (admin, user, accountant)

**When to use it:** When you want your partner, family member, or accountant to access specific parts of your finances without seeing everything.

**How it works:**
1. Go to **Household**
2. Click **Invite Member**
3. Enter their email and select their role
4. Choose which modules they can access (e.g. only Statements and Reports)
5. They'll receive an email invitation to join

---

## 4. Entities

**What it is:** Your financial identities. An entity represents WHO is managing the money.

**Types of entities:**

| Type | Use for | Tax form |
|------|---------|----------|
| **Individual** | Personal finances, employed persons | — |
| **Sole Trader** | Self-employed, freelancers | SA103 (Self Assessment) |
| **Partnership** | Business partnerships | SA800 |
| **Limited Company** | Ltd companies | CT600 (Corporation Tax) |

**How to set up:**

1. Go to **Entities**
2. Click **New Entity**
3. Choose the type (individual, sole trader, partnership, limited company)
4. Fill in the details:
   - Name (e.g. "Bruno Personal" or "Bruno Consulting Ltd")
   - Company number (for limited companies)
   - UTR number (for self-employed — your Unique Taxpayer Reference)
   - VAT number (if VAT registered)
5. Click **Save**

**Why it matters:** The entity you select changes how the system categorises transactions, which HMRC boxes are used in reports, and which tax rules apply. A business lunch is an "allowable expense" for a sole trader but just "dining out" for an individual.

**Tip:** Set your most-used entity as **Default** so it's automatically selected when you log in.

---

## 5. Statements

**What it is:** The heart of HomeLedger. Upload bank statements, and the system extracts, categorises, and organises every transaction.

### Uploading a Statement

1. Go to **Statements**
2. Click **Upload Statement**
3. Select a PDF or CSV file from your bank
4. Choose the **account** and **entity** it belongs to
5. Click **Process**

The system will:
- Extract every transaction (date, description, amount, balance)
- Run each transaction through the **4-layer categorisation engine** (see [Smart Rules](#10-smart-rules))
- Flag uncertain transactions for your review

### Understanding the Transaction Table

Each transaction shows:

| Column | What it means |
|--------|---------------|
| **Date** | Transaction date |
| **Description** | What your bank recorded (e.g. "CARD PAYMENT TO TESCO") |
| **Amount** | The value (negative = expense, positive = income) |
| **Category** | The assigned category (with confidence indicator) |
| **Status** | ✅ Confirmed, 🟡 Suggested, ⚠️ Needs Review |

### Reviewing Transactions

- **Green tick ✅** — Auto-categorised with high confidence. No action needed.
- **Yellow dot 🟡** — Suggested category, 70–89% confidence. Click to confirm or change.
- **Red flag ⚠️** — Low confidence or uncategorised. Click to assign a category.

### Correcting a Category

1. Click the **category dropdown** next to a transaction
2. Select the correct category from the list
3. The correction is saved immediately
4. The system **learns** from your correction (see [Feedback Loop](#10-smart-rules))

### Bulk Actions

- **Select multiple transactions** using the checkboxes
- Click **Bulk Categorise** to assign the same category to all selected
- Use **filters** to find specific transactions (by date, amount, category, or status)

### Statement Summary

At the top of each statement, you'll see:
- **Total Income** / **Total Expenses** / **Net**
- **Categorised %** — How many transactions have a category
- **Needs Review** — How many still need your attention

---

## 6. Documents

**What it is:** Scan and process physical documents — receipts, invoices, contracts, letters.

**How to use:**

1. Go to **Documents**
2. Click **Upload** or take a photo with your phone (if using the app)
3. The AI analyses the document and extracts:
   - Type (receipt, invoice, letter, contract)
   - Amount
   - Date
   - Vendor/merchant
   - Key details

**Supported formats:** PDF, JPG, PNG

**Tip:** After scanning a document, you can link it to a specific transaction, invoice, or bill for complete record-keeping.

---

## 7. Invoices

**What it is:** Track money coming IN — invoices you've sent to clients, payments received, outstanding amounts.

**How to use:**

1. Go to **Invoices**
2. Click **New Invoice** to create one manually, or
3. **Upload** an invoice document for automatic extraction
4. The system extracts: client name, amount, date, due date, items

**Features:**
- **Status tracking** — Draft → Sent → Paid → Overdue
- **Filter by entity** — See invoices for a specific business
- **Link to statements** — Match an invoice to the incoming payment in your bank statement

---

## 8. Bills

**What it is:** Track money going OUT — bills to pay, recurring expenses, supplier invoices.

**How to use:**

1. Go to **Bills**
2. Click **New Bill** or **Scan Bill** (for automatic extraction)
3. Fill in: supplier, amount, due date, category, recurrence
4. Track status: Pending → Paid → Overdue

**Features:**
- **Recurring bills** — Set monthly/quarterly/annual bills (rent, utilities, subscriptions)
- **Due date alerts** — Dashboard shows upcoming and overdue bills
- **Scan & auto-fill** — Upload a photo of a bill, and the AI fills in the details
- **Category assignment** — Each bill is auto-categorised for your reports

**Tip:** Keep your bills up to date — it directly improves your Financial Health Score.

---

## 9. Categories

**What it is:** The folders that organise your transactions. Every transaction belongs to a category.

### Default Categories

HomeLedger comes with UK-relevant categories pre-configured:

**Income categories:**
- Salary / Wages
- Client Payments / Freelance Income
- Rental Income
- Interest / Dividends
- Government Benefits
- Other Income

**Expense categories:**
- Groceries & Household
- Utilities (Gas, Electric, Water)
- Rent / Mortgage
- Transport & Travel
- Subscriptions & Memberships
- Dining & Takeaway
- Health & Wellbeing
- Insurance
- Clothing
- Entertainment
- Childcare & Education
- Office Costs (business)
- Professional Fees (business)
- Marketing & Advertising (business)
- Tax Payments
- And many more...

### Creating Custom Categories

1. Go to **Categories**
2. Click **New Category**
3. Enter:
   - **Name** — e.g. "Client Lunches"
   - **Type** — Income or Expense
   - **Parent category** (optional) — for sub-categories
   - **Tax nature** — How HMRC treats this (allowable expense, non-deductible, capital, etc.)
4. Click **Save**

### Sub-Categories

Categories can be nested. For example:
```
Transport
  ├── Fuel
  ├── Public Transport
  ├── Parking
  └── Vehicle Maintenance
```

This gives you both a high-level view ("Transport: £450/month") and detailed breakdowns.

### Tax Nature

Each category can have a **tax nature** that tells the reports system how to treat it for HMRC:

| Tax Nature | Meaning |
|-----------|---------|
| **Allowable expense** | Reduces your tax bill (business expenses) |
| **Non-deductible** | Not tax-deductible (personal expenses) |
| **Capital expenditure** | Large purchases (equipment, vehicles) |
| **Exempt** | Not subject to tax |

---

## 10. Smart Rules

**What it is:** The brain of the categorisation system. View, create, and manage the rules that automatically categorise your transactions.

### How the 4-Layer Engine Works

When a transaction arrives, it passes through 4 layers in order:

#### Layer 1 — Rules (Instant Recognition)
The system checks the transaction description against a database of rules. If it matches, the category is assigned instantly with 100% confidence.

**Example:** "TESCO STORES" matches the rule "TESCO → Groceries" ✅

HomeLedger comes with **100+ pre-loaded rules** for common UK merchants (Tesco, Sainsbury's, Netflix, British Gas, HMRC, etc.)

#### Layer 2 — Patterns (Your History)
If no rule matches, the system looks at your past corrections. If you've categorised similar transactions before, it recognises the pattern.

**Example:** You previously corrected "ACME LTD" to "Client Payments". Next time ACME LTD appears, the system suggests "Client Payments" with 85% confidence.

The more corrections you make, the smarter this layer becomes.

#### Layer 3 — AI Classification
For truly unknown transactions, the AI analyses the description, amount, and context, then suggests a category with a confidence score and explanation.

**Example:** "WEWORK MEMBERSHIP" → AI suggests "Office Costs" at 88% confidence, noting it's a co-working space expense allowable under HMRC SA103.

#### Layer 4 — Feedback Loop (Self-Learning)
Every correction you make is recorded. After **3 identical corrections** for the same merchant, the system automatically creates a new Layer 1 rule.

**Example:**
1. You correct "DELIVEROO" to "Business Meals" (1st time)
2. You correct "DELIVEROO" to "Business Meals" (2nd time)
3. You correct "DELIVEROO" to "Business Meals" (3rd time)
4. → The system creates rule: "DELIVEROO → Business Meals" 🧠

From now on, all Deliveroo transactions are categorised instantly.

### Managing Rules

1. Go to **Smart Rules**
2. You'll see:
   - **Metrics cards** — Total rules, auto-learned rules, accuracy rate
   - **Rules table** — All rules with keyword, category, source, confidence
   - **Source badges** — `system` (pre-loaded), `manual` (you created), `auto_learned` (feedback loop)
3. To create a new rule:
   - Click **New Rule**
   - Enter the **keyword** (e.g. "AMAZON")
   - Choose the **match type** (keyword, exact, regex)
   - Select the **category**
   - Set **priority** (higher = checked first)
   - Click **Save**

### Your 3 Control Modes

Go to **Settings** → **Categorisation Mode** to choose:

| Mode | Behaviour | Best for |
|------|-----------|----------|
| 🟡 **Conservative** | Nothing auto-approved, everything needs your review | New users, accountants |
| 🟣 **Smart** (default) | ≥90% confidence = auto-approved; 70–89% = suggested; <70% = review | Most users |
| 🔵 **Autonomous** | AI handles everything, you audit exceptions only | High-volume, experienced users |

### How It Improves Over Time

```
Month 1:  60% auto-categorised → you correct the rest → engine learns
Month 2:  75% auto-categorised → feedback loop creates new rules
Month 3:  85% auto-categorised → patterns are established
Month 6:  95%+ auto-categorised → only new merchants need review
```

---

## 11. Providers

**What it is:** Connect your bank accounts via Open Banking for automatic transaction syncing.

### Connecting a Bank

1. Go to **Providers**
2. Click **Connect Bank**
3. Select your bank from the list
4. You'll be redirected to your bank's website to authorise the connection
5. Grant permission (read-only access to your transactions)
6. You'll be redirected back to HomeLedger

### What Happens After Connecting

- **Immediate:** The system syncs **24 months** of transaction history
- **Ongoing:** Transactions sync automatically **3 times per day** (6am, 2pm, 10pm UTC)
- **Manual refresh:** Click **Refresh** on the bank card to sync immediately

### Bank Card Information

Each connected bank shows:
- ✅ **Synced** status with transaction count
- **Last sync** time
- **Auto-sync 3x daily** indicator
- **Refresh** button for manual sync
- **Reconnect** button (if authorisation expires)

### Important Notes

- **Read-only** — HomeLedger can only READ your transactions. It cannot make payments or move money.
- **SCA (Strong Customer Authentication)** — UK banks require re-authorisation every 90 days. When prompted, click "Reconnect" to refresh access.
- **Deduplication** — If you upload a statement AND have Open Banking connected for the same account, the system detects duplicates and won't create double entries.

---

## 12. Reports

**What it is:** Generate financial reports for personal insight, business accounting, and HMRC submissions.

### Types of Reports

#### Summary Report
A complete overview of your finances for a selected period:
- Total income vs. expenses
- Category breakdown with charts
- Monthly trend analysis
- Top merchants by spending

#### Statements Report
Detailed transaction listing with filters:
- By date range, category, account
- Exportable to PDF

#### Categories Report
Spending breakdown by category:
- Pie chart of expense distribution
- Comparison with previous periods
- Uncategorised transaction count

#### Bills Report
Bill payment history and projections:
- Paid vs. unpaid
- Upcoming due dates
- Monthly bill totals

#### Invoices Report
Income tracking:
- Sent vs. paid vs. overdue
- Client breakdown
- Outstanding amounts

### HMRC-Ready Reports

For sole traders and limited companies, HomeLedger maps your categories to **HMRC Self Assessment boxes**:

| HMRC Box | Category | Example |
|----------|----------|---------|
| Box 15 | Turnover | Client Payments, Sales |
| Box 17 | Car, Van & Travel | Fuel, Parking, Train tickets |
| Box 18 | Wages & Staff Costs | Salaries, NI contributions |
| Box 20 | Rent, Rates & Insurance | Office rent, Business insurance |
| Box 21 | Repairs & Maintenance | Equipment repairs |
| Box 24 | Accountancy Fees | Accounting software, accountant |
| Box 25 | Phone, Internet, Stationery | Mobile, broadband, office supplies |
| Box 27 | Advertising & Marketing | Google Ads, flyers |
| Box 29 | Other Expenses | Miscellaneous |

### Exporting Reports

- Click **Export PDF** on any report to generate a professional PDF
- PDF includes exact penny amounts, date ranges, and category totals
- Suitable for sending to your accountant or attaching to HMRC submissions

---

## 13. Actions

**What it is:** A task management system tied to your finances. Track things you need to do.

**Examples of actions:**
- "Review uncategorised transactions from January"
- "Pay corporation tax by 1st April"
- "Scan and upload Q4 receipts"
- "Review and approve salary payments"

**How to use:**

1. Go to **Actions**
2. Click **New Action**
3. Enter: title, description, due date, priority
4. Link to a specific entity, statement, or category (optional)
5. Mark as **Complete** when done

**Tip:** Keeping your actions up to date improves your Financial Health Score.

---

## 14. Files

**What it is:** A file manager for all your financial documents.

**What you can store:**
- Bank statements (PDF, CSV)
- Receipts and invoices
- Tax returns
- Contracts and agreements
- Any financial document

**How it works:**
1. Go to **Files**
2. Upload documents by dragging and dropping or clicking **Upload**
3. Organise into folders
4. Link files to entities, transactions, or bills

---

## 15. Vault

**What it is:** A secure, encrypted storage for passwords, PINs, account numbers, and other sensitive credentials.

### Security

- All data is encrypted with **AES-256-GCM** (military-grade encryption)
- Encrypted at rest — even database administrators cannot read your vault entries
- Only YOUR account can decrypt the data

### Using the Vault

1. Go to **Vault**
2. Click **New Entry**
3. Choose a **category**:
   - Banking (sort codes, account numbers)
   - Utilities (customer reference numbers)
   - Government (NI number, UTR, Government Gateway)
   - Tax (HMRC login, tax references)
   - Insurance (policy numbers, claims references)
   - Subscriptions (login credentials)
   - Property (tenancy references, landlord details)
   - Legal (solicitor details)
   - Employment (payroll numbers, pension refs)
   - Medical (NHS number, GP details)
   - Other
4. Fill in the fields: name, username, password, notes
5. Click **Save**

### Features

- **Search** — Find entries by name or category
- **Show/Hide passwords** — Click the eye icon to reveal
- **Copy to clipboard** — Click the copy icon
- **Favourites** — Star frequently used entries for quick access
- **AI Auto-fill** — When you scan a document (e.g. a bank letter), the AI can extract credentials and auto-fill a vault entry

---

## 16. Projections

**What it is:** Financial forecasting based on your current income, expenses, and trends.

**What you'll see:**

- **Monthly KPIs** — Income, expenses, net position, forecast for next month
- **Cash Flow Chart** — Bars showing income vs. expenses over time
- **Budget Tracking** — Are you staying within your planned budgets?
- **Savings Goals** — Set targets and track progress
- **Debt Tracker** — Monitor outstanding debts and payoff timelines

### Setting Up Savings Goals

1. Go to **Projections**
2. In the **Savings Goals** section, click **Add Goal**
3. Enter: name (e.g. "Emergency Fund"), target amount (e.g. £5,000), current amount
4. Track progress over time

### Setting Up Debt Tracking

1. In the **Debt Tracker** section, click **Add Debt**
2. Enter: name (e.g. "Credit Card"), total amount, interest rate, monthly payment
3. The system calculates your payoff timeline

**Note:** Savings and debt data is stored locally in your browser for privacy.

---

## 17. Transfers

**What it is:** Record money moving between your own accounts (e.g. current account → savings account).

**Why it matters:** Transfers between your own accounts are NOT income or expenses. Without tracking them properly, your reports would show inflated numbers.

**How to use:**

1. Go to **Transfers**
2. Click **New Transfer**
3. Select: from account, to account, amount, date
4. The system marks both sides of the transaction as "Transfer" so they don't appear in income/expense reports

---

## 18. Properties

**What it is:** Track your property portfolio — residential, buy-to-let, commercial.

**What you can track:**
- Property details (address, type, purchase price, current value)
- Rental income (for buy-to-let)
- Mortgage details (lender, rate, monthly payment)
- Maintenance costs
- Insurance and ground rent

**Useful for:** Landlords, property investors, and anyone tracking their property as an asset.

---

## 19. Product Calculator

**What it is:** Financial product calculators for common UK financial decisions.

**Available calculators:**
- Mortgage repayment calculator
- Loan comparison
- Savings interest calculator
- Tax calculator (income tax, NI)
- VAT calculator

**How to use:** Select a calculator, enter your numbers, and see the results instantly.

---

## 20. Tax Timeline

**What it is:** A visual timeline of all your HMRC tax deadlines throughout the year.

**Deadlines covered:**

| Tax | Key dates |
|-----|-----------|
| **Self Assessment (SA)** | 31 Jan (online filing + payment), 31 Jul (2nd payment on account) |
| **VAT** | Quarterly returns (varies by period) |
| **Corporation Tax (CT)** | 9 months after accounting period end |
| **PAYE** | Monthly RTI submissions |

**How it works:**
- The timeline highlights upcoming deadlines in amber and overdue ones in red
- Click any deadline for details on what you need to do
- Deadlines adapt to your entity type (sole trader vs. limited company)

---

## 21. Life Events

**What it is:** Track major life changes that affect your finances, with tailored tasks and guidance for each event.

**Supported life events:**

| Event | Example tasks generated |
|-------|----------------------|
| **Getting married** | Update tax code, consider marriage allowance, joint account setup |
| **Having a baby** | Register for Child Benefit, check Childcare Vouchers, update will |
| **Buying a home** | Stamp Duty budget, mortgage comparison, solicitor fees |
| **Changing jobs** | Compare pension schemes, update tax code, budget adjustment |
| **Losing a job** | Apply for Universal Credit, reduce expenses, emergency fund check |
| **Inheriting** | Probate process, IHT threshold, investment planning |
| **Sending child to uni** | Student finance application, budget for maintenance |
| **Becoming a carer** | Carer's Allowance, council tax reduction, flexible working |
| **Immigrating to UK** | NI number application, bank account setup, tax registration |
| **Retiring** | State pension check, annuity options, tax-free lump sum |

**How to use:**

1. Go to **Life Events**
2. Click **New Event**
3. Select the event type
4. Fill in details (date, notes)
5. The system generates a checklist of financial tasks specific to that event
6. Work through the tasks and mark them complete

---

## 22. Learn

**What it is:** A financial education section with articles, guides, and resources about UK personal finance.

**Topics covered:**
- Understanding your payslip
- Tax basics for beginners
- How to read a bank statement
- Budgeting methods
- Savings and investments
- Understanding credit scores
- Pensions explained

---

## 23. Academy

**What it is:** A full accounting qualification practice platform, aligned with **AAT** (Association of Accounting Technicians) and **ACCA** (Association of Chartered Certified Accountants).

### Qualification Levels

| Level | Qualification | Typical role |
|-------|-------------|-------------|
| **Level 2** | AAT Foundation Certificate | Accounts Assistant |
| **Level 3** | AAT Advanced Diploma | Accounts Technician |
| **Level 4** | AAT Professional Diploma | Accounting Manager |
| **Level 5** | ACCA Applied Knowledge | Finance Analyst |
| **Level 6** | ACCA Strategic Professional | Chartered Accountant |

### Taking an Exam

1. Go to **Academy**
2. Select a qualification level
3. Choose a module (e.g. "Bookkeeping Transactions" for Level 2)
4. Choose your mode:
   - **Timed Mode** — Real exam conditions (countdown timer, anti-cheat tab detection, auto-submit)
   - **Study Mode** — No timer, reveal answers, see explanations, access AI tutor
5. Answer the questions
6. Submit and see your score

### AI Tutor

In Study Mode, you can open the **AI Tutor Panel** for any question. The AI will:
- Explain why the correct answer is right
- Explain why other options are wrong
- Give real-world examples
- Reference relevant accounting standards

### Tracking Your Progress

- Your best scores per module are saved
- Progress bars show how far you've come in each level
- Retake exams as many times as you want

---

## 24. Relocation Hub

**What it is:** An AI-powered guide for people relocating to or settling in the UK.

**What it covers:**
- Opening a UK bank account
- Getting a National Insurance number
- Understanding the NHS
- Registering with HMRC
- Finding accommodation
- Understanding UK tax for newcomers
- Council Tax explained
- Visa and immigration basics

**How it works:**
1. Go to **Relocation**
2. Ask the AI assistant any question about UK life
3. Or click one of the **quick topics** for instant guidance
4. Conversation history is saved

**Important:** The AI provides general guidance only. For immigration advice, always consult a qualified **OISC-registered adviser**.

---

## 25. Services

**What it is:** A marketplace for professional financial services — bookkeeping, tax filing, payroll, and more.

**Available services:**
- Bookkeeping packages (monthly/quarterly)
- Self Assessment filing
- Corporation Tax filing
- VAT returns
- Payroll management
- Company formation

**How to use:**

1. Go to **Services**
2. Browse packages by category
3. Click **Learn More** for details (deliverables, requirements, pricing)
4. Click **Purchase** to start (Stripe payment integration)
5. Track your purchase status in **My Purchases**

---

## 26. Settings

**What it is:** Personalise your HomeLedger experience.

**What you can configure:**

### Profile
- Name, email, avatar
- Password change

### Categorisation Mode
Choose how the AI categorises your transactions:
- **Conservative** — Review everything manually
- **Smart** (recommended) — Auto-approve high confidence, review the rest
- **Autonomous** — Let AI handle it all

### Notifications
- Email alerts for due dates
- Budget overspend warnings
- Bank sync failures

### Data
- Export all your data
- Delete account

---

## 27. AI Chat Assistant

**What it is:** A floating chat bubble available on every page. Ask questions about your finances and get contextual, intelligent answers.

**Where to find it:** Look for the chat bubble icon in the bottom-right corner of any page.

**What makes it smart:** The AI knows which page you're on and pulls relevant data:

| Page | AI context |
|------|-----------|
| Statements | Your recent transactions, uncategorised items |
| Reports | Your income/expense summaries |
| Bills | Upcoming and overdue bills |
| Categories | Your category structure |
| Invoices | Outstanding and recent invoices |

**Example conversations:**

- *"How much did I spend on groceries last month?"*
- *"What's my largest expense category?"*
- *"Help me categorise this ACME LTD transaction."*
- *"Is my mobile phone bill tax-deductible?"*
- *"Suggest ways to reduce my monthly expenses."*

**Tip:** Use the suggested questions that appear when you first open the chat — they're tailored to your current page.

---

## 28. Sharing — Accountant Portal

**What it is:** Share a read-only view of your financial data with your accountant.

### Creating a Shared Link

1. Go to **Settings** or the **Share** section
2. Click **Create Shared Link**
3. Choose what to share:
   - Statements & transactions
   - Reports
   - Category breakdown
   - Bills & invoices
4. Set an **expiry date** (optional)
5. Copy the generated link and send it to your accountant

### What Your Accountant Sees

- A clean, read-only view of your selected data
- No login required — they access via the unique token link
- Cannot modify, delete, or export your data
- The link expires when you revoke it or it reaches the expiry date

**Privacy:** You control exactly what's shared. Revoke the link at any time.

---

## 29. Tips & Best Practices

### For Best Categorisation Accuracy

1. **Correct mistakes promptly** — Every correction trains the AI
2. **Use consistent names** — Don't create "Travel" and "Transport" for the same thing
3. **Create specific rules** — For recurring merchants, create a Smart Rule once and forget it
4. **Start with Smart Mode** — Switch to Autonomous once you're confident in the system

### For Best Reports

1. **Categorise everything** — Uncategorised transactions won't appear in category reports
2. **Set correct tax nature** — This determines how HMRC reports are generated
3. **Use the right entity** — Business expenses should be under your business entity, not personal

### For Security

1. **Use a strong password** — At least 12 characters with mixed case, numbers, and symbols
2. **Store credentials in the Vault** — Not in sticky notes or text files
3. **Revoke shared links** when your accountant no longer needs access
4. **Re-authorise Open Banking** connections when prompted (every 90 days)

### For Daily Use

1. **Check Dashboard weekly** — Monitor your health score and budget alerts
2. **Process statements monthly** — Don't let them pile up
3. **Review Smart Rules quarterly** — Delete outdated rules, create new ones
4. **Export reports before tax deadlines** — Don't leave it to the last minute

---

## Glossary

| Term | Meaning |
|------|---------|
| **Entity** | A financial identity (person, sole trader, or company) |
| **Categorisation** | Assigning a category (e.g. "Groceries") to a transaction |
| **Smart Rule** | An automatic categorisation rule (keyword → category) |
| **Confidence Score** | How certain the AI is about a category (0–100%) |
| **Feedback Loop** | The system learning from your corrections |
| **SA103** | HMRC Self Assessment supplementary pages (self-employment) |
| **CT600** | HMRC Corporation Tax return form |
| **SCA** | Strong Customer Authentication (bank security for Open Banking) |
| **Open Banking** | UK regulated system to securely share bank data with apps |
| **AES-256-GCM** | Military-grade encryption standard used for the Vault |
| **UTR** | Unique Taxpayer Reference (10-digit HMRC number) |
| **NI** | National Insurance |
| **VAT** | Value Added Tax |
| **PAYE** | Pay As You Earn (employer tax deduction system) |

---

## Need Help?

- **AI Chat** — Click the chat bubble on any page
- **Email** — Contact support through the app
- **This guide** — Bookmark it for reference

---

*HomeLedger — Your finances, simplified.*
*Built for UK households, sole traders, and limited companies.*
*© 2026 HomeLedger. All rights reserved.*
