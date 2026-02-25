# HomeLedger — Suggested Improvements

These are suggestions based on our current architecture (Entities, Statements, Life Events, Reports, etc.) for your review. Prioritise as you see fit.

---

## 1. REPORTS — Per Entity/Regime Overhaul

### Current State
Reports already filter by entity and switch between CT600 (companies) and SA103 (self-assessment). But they can go much further.

### Suggested Improvements

**A) Entity-Specific Report Types:**

| Entity Type | Reports |
|-------------|---------|
| **Limited Company** | P&L Statement, Balance Sheet, CT600 Summary, Director's Loan Account, Dividend Vouchers, Corporation Tax Estimate, Annual Accounts draft |
| **LLP** | Partners' Profit Share, Members' Capital Accounts, Partnership Tax Return (SA800) |
| **Sole Trader** | SA103 (Self-Employment), Cash Basis vs Accruals comparison, Allowable Expenses breakdown |
| **Individual (Employee)** | SA100 (Tax Return), P60 Summary, Employment Income vs Expenses, Student Loan estimate |
| **Individual (Landlord)** | SA105 (UK Property), Rental Income vs Expenses, Wear & Tear allowance |

**B) Comparative Reports:**
- Year-on-year comparison (this year vs last year)
- Entity-to-entity comparison (Company A vs Company B)
- Monthly/quarterly trend analysis

**C) Tax-Smart Reports:**
- **Dividend vs Salary Calculator** — optimal split for director/shareholders
- **VAT Summary** — input vs output tax, quarterly breakdown, MTD-ready format
- **Corporation Tax Estimate** — with marginal relief calculation (19-25%)
- **National Insurance breakdown** — Class 1, 2, 4 based on employment status

**D) Compliance Reports:**
- **Confirmation Statement checklist** — what changed since last CS01
- **Overdue items dashboard** — accounts, CS, tax returns due
- **Director responsibilities checklist** — per company

---

## 2. LEARNING CENTRE — UK Law & Regulation Updates

### Concept
A `/learn` page that provides up-to-date guidance on UK tax, company, and property laws. Content can be:

**A) Static Guides (curated by us):**
- Setting up a Limited Company (step by step)
- Self Assessment: What expenses can I claim?
- Corporation Tax rates and thresholds 2025/26
- VAT registration: When and how
- Dividend tax explained
- Property rental: tax obligations
- Making Tax Digital (MTD) — what you need to know
- Companies House obligations timeline
- Director's responsibilities
- IR35 and off-payroll working

**B) AI-Powered Q&A:**
- The existing AI Chat already has section context
- Enhance it with a dedicated "UK Tax & Law" mode that references HMRC manuals
- User asks "Can I claim my home office as a business expense?" → AI answers with HMRC reference

**C) Regulation Feed (automated):**
- Scrape/parse gov.uk announcements for:
  - Tax rate changes
  - Filing deadline changes
  - New compliance requirements
  - Companies House policy updates
- Show as a news feed with date, category, and impact level
- Can use Gemini to summarise gov.uk pages

**D) Entity-Relevant Alerts:**
- Based on entity type, show only relevant guides
- e.g., if you have a Limited Company → show CT600 guides, not SA103
- If you added a property → show SA105 and landlord guides

### Implementation Path
1. Start with 15-20 static Markdown guides (we write them)
2. Add AI Q&A with gov.uk context
3. Later: automated regulation feed via gov.uk RSS/API

---

## 3. PROPERTY-SPECIFIC REPORTS

Since you have a Properties section, we can add:

- **Rental yield calculator** — annual rent vs property value
- **SA105 auto-fill** — pull rental income/expenses from statements
- **Mortgage tracker** — interest vs capital, tax relief calculation
- **Capital gains estimate** — purchase price vs current value, with annual exemption
- **Stamp Duty calculator** — for purchases, with surcharge for additional properties

---

## 4. ENTITY DASHBOARD (Enhanced)

Currently `/entities` shows cards. Could add:

- **Financial summary per entity** — total income, expenses, profit (from statements)
- **Compliance status** — green/amber/red for each deadline
- **Quick actions** — "File CS01", "Submit accounts", "Pay CT"
- **Health score per entity** — similar to the global health score but entity-specific

---

## 5. MULTI-ENTITY TAX PLANNING

For users with multiple entities (like you with 5 companies + personal):

- **Global tax overview** — total tax liability across all entities
- **Income allocation advisor** — which entity should invoice which client?
- **Intercompany transactions** — track loans, management charges between entities
- **Personal vs Business split** — what's personal, what's business expense

---

## 6. EMPLOYEE/PAYROLL AWARENESS

If entity has PAYE Reference:

- **Payroll summary** — salary costs per entity
- **Employer NIC calculator**
- **P11D tracking** — benefits in kind
- **Auto-enrolment pension reminder**

---

## 7. DOCUMENT MANAGEMENT ENHANCEMENTS

For the new History & Docs tab:

- **OCR on uploaded documents** — extract text from scanned letters (using Docling)
- **AI categorisation** — auto-detect document type from content
- **Expiry alerts** — insurance policies, certificates, contracts with end dates
- **Template library** — common letters (resignation, appointment, address change)

---

## Priority Recommendation

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 High | Entity-specific reports (CT600, SA103, SA105) | Medium | Very High |
| 🔴 High | Dividend vs Salary calculator | Low | High |
| 🟡 Medium | Learning Centre with static guides | Low | High |
| 🟡 Medium | Compliance dashboard per entity | Medium | High |
| 🟡 Medium | Property reports (SA105, rental yield) | Medium | Medium |
| 🟢 Low | Regulation feed (automated) | High | Medium |
| 🟢 Low | Multi-entity tax planning | High | High |
| 🟢 Low | Payroll awareness | Medium | Low |

---

*Generated 25 Feb 2026 — Review and let me know which ones to implement first.*
