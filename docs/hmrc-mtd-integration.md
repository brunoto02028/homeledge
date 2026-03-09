# Clarity & Co — HMRC Making Tax Digital (MTD) Integration Plan

**Date:** March 2026
**Status:** Pre-registration (Sandbox phase)

---

## 1. What is MTD?

Making Tax Digital requires UK businesses and self-employed individuals to:
- Keep digital records of income and expenses
- Submit tax information to HMRC using MTD-compatible software

Clarity & Co already handles digital record-keeping. The next step is direct HMRC API integration.

---

## 2. MTD APIs Required

### Phase 1: Income Tax Self Assessment (ITSA) — Priority
| API | Endpoint | Purpose |
|-----|----------|---------|
| **Individual Calculations** | `/individuals/calculations` | View tax calculations |
| **Individual Losses** | `/individuals/losses` | Claim/manage losses |
| **Business Details** | `/individuals/business/details` | Self-employment business info |
| **Business Income** | `/individuals/business/income-source-summary` | Income summaries |
| **Property Business** | `/individuals/business/property` | Rental income |
| **Obligations** | `/obligations/details` | What needs to be submitted and when |
| **Self Assessment** | `/individuals/self-assessment` | Final declaration |

### Phase 2: VAT (for VAT-registered businesses)
| API | Endpoint | Purpose |
|-----|----------|---------|
| **VAT** | `/organisations/vat` | Submit VAT returns, view obligations/payments |

### Phase 3: Corporation Tax (future)
| API | Endpoint | Purpose |
|-----|----------|---------|
| **Corporation Tax** | `/organisations/corporation-tax` | CT submissions |

---

## 3. HMRC Developer Registration

### Steps:
1. ✅ Create HMRC Developer Hub account: https://developer.service.hmrc.gov.uk
2. ⬜ Register application in Sandbox
3. ⬜ Get Sandbox Client ID + Client Secret
4. ⬜ Implement OAuth 2.0 authorization flow
5. ⬜ Test all endpoints in Sandbox
6. ⬜ Apply for Production credentials
7. ⬜ Pass HMRC review (fraud prevention headers required)
8. ⬜ Go live

### Required Fraud Prevention Headers
HMRC requires specific headers on every API call:
```
Gov-Client-Connection-Method: WEB_APP_VIA_SERVER
Gov-Client-Public-IP: <user's IP>
Gov-Client-Timezone: UTC+00:00
Gov-Client-User-Agent: <browser user-agent>
Gov-Client-Window-Size: width=X&height=Y
Gov-Client-Browser-Plugins: <plugin list>
Gov-Client-Screens: width=X&height=Y&colour-depth=D
Gov-Vendor-Version: Clarity & Co=2.1.0
Gov-Vendor-Product-Name: Clarity & Co
Gov-Client-Device-ID: <unique device ID>
Gov-Client-User-IDs: Clarity & Co=<userId>
```

---

## 4. Clarity & Co Implementation Architecture

### OAuth Flow
```
User clicks "Connect HMRC" in Settings
  → Redirect to HMRC authorization page
  → User grants access
  → HMRC redirects back with auth code
  → Exchange code for access_token + refresh_token
  → Store tokens encrypted in DB
```

### API Routes Needed
```
/api/hmrc/connect          — Start OAuth flow
/api/hmrc/callback         — OAuth callback
/api/hmrc/obligations      — Fetch submission deadlines
/api/hmrc/submit-period    — Submit quarterly update
/api/hmrc/calculation      — View tax calculation
/api/hmrc/final-declaration — Submit end-of-year
/api/hmrc/vat-return       — Submit VAT return (Phase 2)
```

### Database Schema Addition
```prisma
model HmrcConnection {
  id            String   @id @default(cuid())
  userId        String
  entityId      String?
  accessToken   String   // encrypted
  refreshToken  String   // encrypted
  expiresAt     DateTime
  scope         String   // e.g. "read:self-assessment write:self-assessment"
  vrn           String?  // VAT Registration Number
  nino          String?  // National Insurance Number (encrypted)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("hmrc_connections")
}
```

---

## 5. HMRC Software List Registration

To appear on HMRC's list of recognised MTD software:

1. ⬜ Complete Sandbox testing for all required APIs
2. ⬜ Apply for Production credentials
3. ⬜ Pass HMRC production review
4. ⬜ Submit software details form to HMRC
5. ⬜ Provide: Software name, website, supported MTD services, pricing, bridging/native
6. ⬜ Wait for listing (typically 2-4 weeks after approval)

### Software Details for Submission
| Field | Value |
|-------|-------|
| Software Name | Clarity & Co |
| Website | https://clarityco.co.uk |
| Type | Native (not bridging) |
| MTD Services | ITSA (Income Tax Self Assessment) |
| Platform | Web (cloud-based) |
| Pricing | From £7.99/month |
| Free Trial | 7-day free trial |
| Support | Email: support@clarityco.co.uk |

---

## 6. Timeline

| Milestone | Target Date | Status |
|-----------|-------------|--------|
| HMRC Developer Hub registration | March 2026 | ⬜ Pending |
| Sandbox app creation | March 2026 | ⬜ Pending |
| OAuth flow implementation | April 2026 | ⬜ Pending |
| Sandbox endpoint testing | April 2026 | ⬜ Pending |
| Fraud prevention headers | April 2026 | ⬜ Pending |
| Production credentials application | May 2026 | ⬜ Pending |
| HMRC review | May-June 2026 | ⬜ Pending |
| Software list submission | June 2026 | ⬜ Pending |
| Go live | July 2026 | ⬜ Pending |
