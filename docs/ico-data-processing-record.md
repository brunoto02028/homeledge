# Clarity & Co — ICO Data Processing Record (Article 30 GDPR)

**Organisation:** Clarity & Co (operated by Bruno Azenha Tonheta)
**Website:** https://clarityco.co.uk
**Contact:** privacy@clarityco.co.uk
**Date:** March 2026

---

## 1. Controller Details

| Field | Value |
|-------|-------|
| Controller Name | Bruno Azenha Tonheta (trading as Clarity & Co) |
| Address | United Kingdom |
| Email | privacy@clarityco.co.uk |
| ICO Registration | Pending — Fee: £40/year (Tier 1) |
| DPO Appointed | No (not required for SME under 250 employees) |

---

## 2. Purposes of Processing

| Purpose | Lawful Basis | Categories of Data | Retention |
|---------|-------------|-------------------|-----------|
| Account creation & authentication | Contract (Art.6(1)(b)) | Name, email, password hash | Until account deletion |
| Financial management (statements, bills, invoices) | Contract | Bank transactions, amounts, descriptions, dates | Until account deletion |
| AI categorisation of transactions | Legitimate Interest (Art.6(1)(f)) | Transaction descriptions, amounts | Until account deletion |
| Tax report generation (SA103, CT600) | Contract | Financial summaries, tax calculations | Until account deletion |
| Identity verification (Yoti IDV) | Legal Obligation (Art.6(1)(c)) / Consent | Identity documents, biometric data (facial) | Processed by Yoti, not stored by Clarity & Co |
| Open Banking sync (TrueLayer) | Consent (Art.6(1)(a)) | Bank account details, transactions, balances | Until consent withdrawn or account deleted |
| Email management | Contract | Email headers, bodies, attachments | Until account deletion |
| Document scanning (Capture & Classify) | Contract | Uploaded documents, OCR text | Until account deletion |
| Secure vault (credential storage) | Contract | Encrypted credentials (AES-256-GCM) | Until account deletion |
| Login alerts & security | Legitimate Interest | IP address, user agent, login timestamps | 12 months |
| Analytics & site tracking | Legitimate Interest | Page views, feature usage (anonymised) | 26 months |
| Marketing emails | Consent | Email address | Until unsubscribe |

---

## 3. Categories of Data Subjects

- **Individual users** — UK residents managing personal finances
- **Business users** — UK small business owners, sole traders, freelancers
- **Team members** — Employees/staff invited by business users
- **Verification subjects** — Individuals undergoing identity verification via Yoti

---

## 4. Categories of Personal Data

| Category | Examples | Special Category? |
|----------|---------|-------------------|
| Identity data | Full name, email address | No |
| Authentication data | Password hash, 2FA codes, session tokens | No |
| Financial data | Bank transactions, amounts, balances, invoices, bills | No |
| Business data | Company names, registration numbers, UTR, VAT numbers | No |
| Document data | Scanned letters, receipts, OCR text | No |
| Vault data | Encrypted passwords, API keys (AES-256-GCM encrypted) | No |
| Biometric data | Facial images (via Yoti IDV only) | **Yes** (Art.9) — processed by Yoti as independent processor |
| Identity documents | Passport, driving licence (via Yoti IDV only) | No — processed by Yoti |
| Technical data | IP address, browser type, device info | No |
| Location data | Approximate location from IP (not precise GPS) | No |

---

## 5. Third-Party Processors

| Processor | Purpose | Data Shared | Location | Safeguards |
|-----------|---------|-------------|----------|------------|
| Hostinger | VPS hosting | All app data (encrypted at rest) | UK (Manchester) | DPA, EU SCCs |
| TrueLayer | Open Banking | Bank account ID, transactions | UK | FCA regulated, DPA |
| Yoti | Identity verification | Identity documents, biometric | UK | ICO registered, DIATF certified |
| Google (Gemini API) | AI processing | Transaction descriptions (no PII sent) | EU/US | Google Cloud DPA, SCCs |
| Stripe | Payment processing | Name, email, card (tokenised) | US | PCI DSS Level 1, EU SCCs |
| AWS S3 | File storage | Uploaded documents (encrypted) | EU (Ireland) | AWS DPA, SCCs |
| Resend | Transactional emails | Email address, name | US | DPA |

---

## 6. Technical & Organisational Measures

### Access Controls
- [x] Password-based authentication with bcrypt hashing
- [x] Email verification required for new accounts
- [x] Role-based access control (RBAC) with granular permissions
- [x] Admin-only routes protected in middleware
- [x] Rate limiting on authentication endpoints

### Encryption
- [x] HTTPS/TLS for all data in transit (Let's Encrypt)
- [x] HSTS header with 2-year max-age
- [x] AES-256-GCM encryption for vault entries
- [x] Database passwords hashed with bcrypt (10 rounds)

### Infrastructure
- [x] Dedicated VPS (not shared hosting)
- [x] PostgreSQL with password authentication
- [x] Nginx reverse proxy with security headers
- [x] PM2 process manager with auto-restart
- [x] Daily automated database backups (30-day retention)

### Application Security
- [x] Content Security Policy (CSP) header
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy: strict-origin-when-cross-origin
- [x] Rate limiting on sensitive endpoints
- [x] Audit trail for sensitive operations

### Data Subject Rights
- [x] Right of Access — /api/export (JSON/CSV data export)
- [x] Right to Erasure — /api/settings/delete-account (full account deletion)
- [x] Right to Data Portability — Export in machine-readable format (JSON)
- [x] Right to Rectification — Users can edit all their data via the UI

---

## 7. Data Protection Impact Assessment (DPIA) Triggers

| Processing Activity | DPIA Required? | Status |
|---------------------|---------------|--------|
| AI categorisation of financial data | Possibly (automated decision-making) | Low risk — user can override all AI decisions |
| Identity verification (biometric) | Yes (special category data) | Yoti handles as independent processor; their DPIA applies |
| Open Banking data access | Possibly (large scale financial data) | TrueLayer is FCA-regulated; consent-based |
| Email content processing | Low risk | User-initiated; data stays on our server |

---

## 8. International Transfers

| Transfer | Destination | Safeguard |
|----------|-------------|-----------|
| Google Gemini API | US/EU | Standard Contractual Clauses (SCCs) |
| Stripe | US | PCI DSS + SCCs |
| AWS S3 | EU (Ireland) | No transfer outside EU |
| Resend (email) | US | SCCs |

---

## 9. ICO Registration Checklist

- [ ] Register at https://ico.org.uk/registration/new
- [ ] Fee: £40/year (Tier 1: turnover < £632k, < 10 employees)
- [ ] Set renewal to annual auto-pay
- [ ] Add registration number to Privacy Policy footer
- [ ] Add registration number to /terms page
- [ ] Display ICO registration badge on homepage

---

## 10. Retention Schedule

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| User account data | Until account deletion | Prisma cascade delete |
| Financial data (statements, transactions) | Until account deletion | Prisma cascade delete |
| Uploaded documents | Until account deletion | S3 object deletion + DB cascade |
| Audit logs (events) | 2 years | Automated cleanup |
| Database backups | 30 days (daily), 12 weeks (weekly) | Automated pruning |
| Session tokens | 30 days | Auto-expiry |
| Rate limit data | 1 minute (sliding window) | In-memory, auto-cleared |
