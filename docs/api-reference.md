# HomeLedger — API Reference

All API routes require authentication unless marked as **Public**.  
Authentication is via NextAuth.js session cookies.

---

## Academy

### GET `/api/academy/courses`

List all course levels with modules and user's best attempt per module.

**Response:**
```json
{
  "courses": [
    {
      "id": "clx...",
      "level": 2,
      "name": "AAT Level 2 Foundation Certificate in Accounting",
      "shortName": "Level 2 — Foundation",
      "description": "...",
      "hmrcPermissions": ["Basic bookkeeping for sole traders"],
      "chPermissions": [],
      "professionalBody": "AAT",
      "qualificationTitle": "AAT Foundation Certificate in Accounting",
      "estimatedStudyHours": 200,
      "examCostGbp": 240,
      "careerPaths": ["Accounts Assistant", "Trainee Bookkeeper"],
      "salaryRangeMin": 18000,
      "salaryRangeMax": 24000,
      "iconEmoji": "📗",
      "color": "#22c55e",
      "modules": [
        {
          "id": "clx...",
          "title": "Bookkeeping Transactions",
          "code": "BTRN",
          "passMarkPercent": 70,
          "timeLimitMinutes": 90,
          "totalQuestions": 40,
          "questionCount": 8,
          "bestAttempt": {
            "scorePercent": 87.5,
            "passed": true,
            "mode": "timed"
          }
        }
      ]
    }
  ]
}
```

### GET `/api/academy/modules/:moduleId/questions`

Fetch questions for a module.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `mode` | `timed \| study` | `study` | In timed mode, `isCorrect` and `explanation` are omitted from options |

**Response:**
```json
{
  "module": { "id": "...", "title": "...", "passMarkPercent": 70, "timeLimitMinutes": 90 },
  "questions": [
    {
      "id": "...",
      "questionText": "What is the fundamental principle of double-entry bookkeeping?",
      "topic": "Double Entry Principles",
      "difficulty": "easy",
      "aiExplanation": "Double-entry bookkeeping is based on...",
      "options": [
        { "id": "...", "optionText": "Every transaction has two equal entries", "isCorrect": true, "explanation": "Correct! ..." }
      ]
    }
  ],
  "mode": "study"
}
```

### POST `/api/academy/exam`

Start a new exam attempt.

**Body:**
```json
{ "moduleId": "clx...", "mode": "timed" }
```

**Response:**
```json
{ "attempt": { "id": "clx...", "status": "in_progress", "totalQuestions": 40, "timeLimitMinutes": 90 } }
```

### GET `/api/academy/exam`

List user's exam attempts.

**Query params:** `moduleId` (optional)

### POST `/api/academy/exam/submit`

Submit exam answers and get graded results.

**Body:**
```json
{
  "attemptId": "clx...",
  "answers": [
    { "questionId": "q1", "selectedOptionId": "opt1" },
    { "questionId": "q2", "selectedOptionId": "opt5" }
  ],
  "timeSpentSeconds": 1842
}
```

**Response:**
```json
{
  "attempt": { "id": "...", "status": "completed", "scorePercent": 75, "passed": true },
  "results": {
    "totalQuestions": 8,
    "correctAnswers": 6,
    "scorePercent": 75,
    "passed": true,
    "passMarkPercent": 70,
    "gradedAnswers": [
      { "questionId": "q1", "selectedOptionId": "opt1", "correctOptionId": "opt1", "isCorrect": true }
    ]
  }
}
```

---

## AI

### POST `/api/ai/ask`

Context-aware AI assistant.

**Body:**
```json
{
  "user_prompt": "Explain double-entry bookkeeping",
  "context": "accounting",
  "history": [
    { "role": "user", "content": "What is a trial balance?" },
    { "role": "assistant", "content": "A trial balance is..." }
  ]
}
```

**Contexts:** `accounting` (AAT/ACCA tutor), `immigration` (OISC-compliant guide), `finance` (general UK finance)

**Response:**
```json
{ "answer": "Double-entry bookkeeping is...", "context": "accounting", "provider": "gemini" }
```

### POST `/api/ai/chat`

General AI chat with per-section context (existing endpoint).

**Body:**
```json
{ "message": "...", "section": "statements", "history": [] }
```

---

## Services

### GET `/api/services`

List all active service packages.

**Response:**
```json
{
  "packages": [
    {
      "id": "...",
      "title": "National Insurance Number (NIN) Registration Support",
      "slug": "nin-registration",
      "priceGbp": 149,
      "originalPriceGbp": null,
      "deliverables": ["Eligibility assessment", "Application form completed"],
      "requirements": ["Valid passport or BRP"],
      "estimatedDays": 14,
      "category": "relocation",
      "isFeatured": true
    }
  ]
}
```

### GET `/api/services/purchases`

List user's purchases.

### POST `/api/services/purchases`

Create a new purchase.

**Body:**
```json
{ "servicePackageId": "clx..." }
```

**Response (201):**
```json
{ "purchase": { "id": "...", "status": "pending", "amountPaid": 149, "currency": "GBP" } }
```

**Error (409):** Already has active purchase for this service.

---

## Open Banking

### POST `/api/open-banking/connect`

Initiate TrueLayer OAuth flow.

**Body:**
```json
{ "accountId": "clx...", "entityId": "clx..." }
```

### GET `/api/open-banking/callback` — **Public**

OAuth callback from TrueLayer. Exchanges code, syncs 24 months, redirects to providers page.

### POST `/api/open-banking/sync`

Manual incremental sync.

**Body:**
```json
{ "connectionId": "clx..." }
```

### GET `/api/open-banking/connect`

List user's bank connections with enriched data (entityName, transactionCount).

---

## Statements & Transactions

### GET `/api/statements`

List bank statements filtered by entity.

**Query params:** `entityId`, `accountId`

### GET `/api/statements/transactions/:id`

Get transaction details.

### PUT `/api/statements/transactions/:id/categorize`

Update transaction category (triggers feedback loop).

**Body:**
```json
{ "categoryId": "clx..." }
```

---

## Categories

### GET `/api/categories`

List categories filtered by entity regime.

**Query params:** `entityId`, `regime` (`hmrc`, `companies_house`, `universal`)

### POST `/api/categories`

Create a custom category.

---

## Reports

### GET `/api/reports`

Generate financial report data.

**Query params:** `entityId`, `accountId`, `from`, `to`, `type`

---

## Government APIs

### GET `/api/government/ch/:connectionId`

Fetch Companies House data.

**Query params:** `action` (`profile`, `officers`, `filing-history`, `registered-office`, `full-sync`)

### GET `/api/government/hmrc/:connectionId`

Fetch HMRC data.

**Query params:** `action` (`profile`, `sa-obligations`, `sa-calculation`, `vat-obligations`, `full-sync`)

---

## Categorisation

### GET `/api/categorization-rules`

List categorisation rules.

### POST `/api/categorization/feedback`

Record a category correction (feeds the learning loop).

**Body:**
```json
{
  "transactionText": "TESCO STORES",
  "merchantName": "Tesco",
  "suggestedCategory": "General Expenses",
  "finalCategory": "Food & Groceries"
}
```

### GET `/api/categorization/metrics`

Get categorisation metrics (accuracy, rule counts, auto-learned rules).

---

## Auth

### POST `/api/auth/[...nextauth]` — **Public**

NextAuth.js handler (login, register, session, callback).

### POST `/api/signup` — **Public**

Register new user.

**Body:**
```json
{ "name": "Bruno", "email": "bruno@example.com", "password": "..." }
```

---

## Admin (admin role required)

### GET/PUT `/api/settings`

User settings (categorizationMode, preferences).

### GET/POST `/api/admin/users`

User management.

### GET/POST `/api/shared-links`

Accountant portal shared links CRUD.

---

## Error Responses

All endpoints return errors in this format:

```json
{ "error": "Description of the error" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad request (missing/invalid params) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal server error |
