# Clarity & Co — Cyber Essentials Self-Assessment Checklist

**Date:** March 2026
**Assessor:** Internal (pre-assessment before certification body submission)

---

## 1. Firewalls & Internet Gateways

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Firewall configured on all internet-facing devices | ✅ | Hostinger VPS — UFW enabled, only ports 22, 80, 443 open |
| Default admin passwords changed | ✅ | Root password changed, SSH key auth enabled |
| Firewall rules reviewed and unnecessary rules removed | ✅ | Only nginx (80/443) and SSH (22) exposed |
| Block unauthenticated inbound connections by default | ✅ | UFW default deny incoming |

## 2. Secure Configuration

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Unnecessary software removed | ✅ | Minimal Ubuntu 24.04 server install |
| Default passwords changed on all devices/software | ✅ | PostgreSQL, VPS root, app admin all changed |
| Auto-lock/timeout on idle sessions | ✅ | JWT tokens expire after 30 days |
| Unnecessary user accounts disabled | ✅ | Only root + deploy user on VPS |

## 3. User Access Control

| Requirement | Status | Evidence |
|-------------|--------|----------|
| User accounts assigned to individuals | ✅ | Per-user accounts with email verification |
| Admin accounts used only for admin tasks | ✅ | Separate admin role, RBAC enforced in middleware |
| Unnecessary admin accounts removed/disabled | ✅ | Single admin account |
| Authentication required for all user accounts | ✅ | Email + password + optional 2FA |
| Passwords meet minimum complexity requirements | ✅ | Minimum 8 characters enforced at signup |
| MFA available for admin/sensitive accounts | ⚠️ | Email-based login codes available, TOTP not yet implemented |

## 4. Malware Protection

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Anti-malware software installed | ⚠️ | Server-side: ClamAV not installed (consider adding) |
| Anti-malware kept up to date | ⚠️ | N/A — web app, no traditional AV needed |
| Anti-malware configured to scan files on access | ✅ | Uploaded files validated (type, size) before processing |
| Anti-malware configured to scan web pages | N/A | Web app — CSP header prevents XSS |
| Users prevented from running unapproved software | ✅ | Server: no user shell access. App: sandboxed |

## 5. Security Update Management (Patching)

| Requirement | Status | Evidence |
|-------------|--------|----------|
| OS patches applied within 14 days of release | ✅ | Ubuntu unattended-upgrades enabled |
| Software kept up to date | ✅ | Node.js v20 LTS, dependencies regularly updated |
| Unsupported software removed | ✅ | All software is current LTS versions |
| Auto-update enabled where possible | ✅ | Ubuntu auto-security-updates enabled |

---

## Application-Specific Security Controls

| Control | Status | Evidence |
|---------|--------|----------|
| HTTPS enforced | ✅ | Let's Encrypt TLS, HSTS header, HTTP→HTTPS redirect |
| Security headers | ✅ | CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Rate limiting | ✅ | Auth endpoints: 5-10 req/min per IP |
| Input validation | ✅ | Server-side validation on all API routes |
| SQL injection prevention | ✅ | Prisma ORM (parameterised queries) |
| XSS prevention | ✅ | React auto-escaping + CSP header |
| CSRF protection | ✅ | NextAuth CSRF tokens |
| Data encryption at rest | ✅ | Vault: AES-256-GCM. DB: PostgreSQL page encryption |
| Data encryption in transit | ✅ | TLS 1.2+ for all connections |
| Backup & recovery | ✅ | Daily automated backups, tested restore procedure |
| Audit logging | ✅ | Event table for sensitive operations |
| Incident response plan | ⚠️ | Basic logging in place, formal plan needed |

---

## Actions Required Before Certification

1. **Install ClamAV on VPS** (optional — not strictly required for web-only apps)
2. **Document incident response procedure** — who to contact, steps to take
3. **Implement TOTP 2FA** for admin accounts (currently email codes only)
4. **Register with certification body** — e.g., IASME, CyberSmart (£300-500)
5. **Complete online questionnaire** at certification body portal

---

## Certification Bodies (UK)

| Provider | Cost | Turnaround |
|----------|------|------------|
| IASME | £300 + VAT | 1-5 days |
| CyberSmart | £300 + VAT | Same day (automated) |
| Bulletproof | £300 + VAT | 2-3 days |
| IT Governance | £300 + VAT | 1-3 days |

**Recommendation:** CyberSmart — automated assessment, instant certificate, dashboard for ongoing compliance.
