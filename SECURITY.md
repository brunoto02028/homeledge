# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Active  |
| 1.x     | ⚠️ Critical fixes only |
| < 1.0   | ❌ No longer supported |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security issues via email:

📧 **security@homeledger.co.uk**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within **48 hours** and aim to provide a fix within **7 days** for critical issues.

## Security Measures in Place

### Authentication
- NextAuth.js with JWT tokens
- Magic link email authentication
- Session expiry and rotation
- Middleware-enforced route protection

### Data Protection
- AES-256-GCM encryption for Vault entries
- Passwords hashed with bcrypt (cost factor 12)
- Environment variables for all secrets (never hardcoded)
- HTTPS enforced via Nginx + Let's Encrypt

### Authorization
- Role-based access control (admin, accountant, user)
- Feature-level permissions per user/plan
- API route authentication via `requireUserId()`
- Admin routes restricted to admin role

### API Security
- CSRF protection via NextAuth
- Rate limiting on auth endpoints
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM (parameterised queries)

### Third-Party Integrations
- OAuth 2.0 for TrueLayer, HMRC, Companies House
- Tokens stored encrypted in database
- Token refresh with automatic expiry handling
- Webhook signature verification (Stripe, Yoti)

### Infrastructure
- VPS with SSH key authentication
- Firewall (UFW) with minimal open ports
- PM2 process manager with auto-restart
- Regular PostgreSQL backups

## Dependency Management

- Dependabot configured for automated dependency updates
- `npm audit` run as part of CI pipeline
- Critical vulnerabilities patched within 48 hours
