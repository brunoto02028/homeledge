# 🧠 Categorisation Intelligence — User Guide

## How HomeLedger Automatically Categorises Your Transactions

Every time you upload a bank statement or sync your bank account, HomeLedger analyses each transaction and assigns it to the correct category — such as "Groceries", "Transport", "Client Payments", or "Office Costs". This happens through a **4-layer intelligent engine** that gets smarter the more you use it.

---

## The 4 Layers — How It Works

Think of the categorisation engine as a team of 4 specialists, each with a different approach. They work in order — if one can solve it, the next one doesn't need to.

### Layer 1 — Rules (Instant Recognition)

**What it does:** Checks your transaction against a database of known rules.

**Example:** If the description contains "TESCO", it's immediately categorised as "Groceries". If it says "NETFLIX", it goes to "Subscriptions".

**How accurate:** 100% — these are exact matches.

**What you see:** The transaction appears already categorised with a green tick.

HomeLedger comes pre-loaded with **100+ rules** for common UK merchants and payments:

| Pattern | Category | Type |
|---------|----------|------|
| TESCO, SAINSBURY'S, ASDA, LIDL | Groceries | Expense |
| NETFLIX, SPOTIFY, DISNEY+ | Subscriptions | Expense |
| HMRC, TAX PAYMENT | Tax Payments | Expense |
| SALARY, WAGES, PAYROLL | Salary | Income |
| TFL, UBER, TRAINLINE | Transport | Expense |
| BRITISH GAS, EDF, OCTOPUS | Utilities | Expense |

You can also create your own rules in **Smart Rules** (sidebar → Smart Rules → New Rule).

---

### Layer 2 — Patterns (Learning from Your History)

**What it does:** If no rule matches, the engine looks at your past corrections. Have you categorised a similar transaction before? If so, it uses that knowledge.

**Example:** You once corrected "ACME LTD PAYMENT" from "Uncategorised" to "Client Payments". Next time a transaction from ACME LTD appears, the engine remembers and suggests "Client Payments" automatically.

**How accurate:** 70–95%, depending on how many times you've corrected similar transactions.

**What you see:** The transaction appears with a suggested category and a confidence percentage (e.g. "Client Payments — 85% confidence").

The more you correct, the smarter this layer becomes.

---

### Layer 3 — AI Classification (Artificial Intelligence)

**What it does:** For transactions that neither rules nor patterns can identify, the engine sends them to an AI model trained in UK accounting and HMRC tax categories.

**How it works:**
1. The AI receives the transaction description, amount, and type (income/expense)
2. It analyses the context and compares it against UK accounting standards
3. It returns a category suggestion with a confidence score and a brief justification

**Example:** A transaction for "WEWORK MEMBERSHIP FEB" — the AI recognises this as office space and suggests "Office Costs" with 88% confidence, noting: *"Co-working space membership is an allowable business expense under HMRC SA103."*

**How accurate:** 60–95%, depending on the transaction. The AI is particularly strong with:
- Business vs. personal expenses
- HMRC-specific categories (SA103 box mapping)
- Companies House categories (CT600)

**What you see:** The transaction shows an AI-suggested category with a confidence badge and the AI's reasoning.

**Important:** To save time and cost, the AI processes transactions in batches (up to 80 at once), not one by one.

---

### Layer 4 — Feedback Loop (Self-Learning)

**What it does:** Every time you manually correct a category, the engine records that correction. After **3 or more identical corrections** for the same merchant or pattern, it automatically creates a new Layer 1 rule.

**Example:**
1. You receive a transaction: "DELIVEROO ORDER" → AI suggests "Dining & Takeaway"
2. You correct it to "Business Meals" (because you use Deliveroo for client lunches)
3. Next month, another "DELIVEROO ORDER" appears → AI still suggests "Dining & Takeaway"
4. You correct it to "Business Meals" again (2nd time)
5. Third "DELIVEROO ORDER" → you correct to "Business Meals" (3rd time)
6. **The engine now automatically creates a rule:** *"DELIVEROO" → "Business Meals"*

From now on, all Deliveroo transactions are instantly categorised as "Business Meals" via Layer 1 — no AI needed.

**What you see:** A toast notification: *"🧠 Rule Learned! Future 'DELIVEROO' transactions will be auto-categorised."*

---

## Your 3 Control Modes

You choose how much autonomy the engine has. Go to **Settings** → **Categorisation Mode**:

### 🟡 Conservative Mode
> *"I want to review everything."*

- **Nothing** is auto-approved
- Every transaction needs your manual review
- Best for: New users, accountants who want full control, audit-sensitive businesses

### 🟣 Smart Mode (Recommended)
> *"Auto-approve what you're confident about, let me review the rest."*

- **≥ 90% confidence** → Auto-approved ✅
- **70–89% confidence** → Suggested, needs your confirmation
- **< 70% confidence** → Flagged for review ⚠️
- Best for: Most users, good balance of speed and accuracy

### 🔵 Autonomous Mode
> *"Let the AI handle it. I'll audit exceptions."*

- **Everything with a category** → Auto-approved ✅
- **Only truly unknown** transactions → Flagged for review
- **< 50% confidence** → Still flagged as uncertain
- Best for: Experienced users, high-volume businesses, users who trust the system

---

## How the Engine Gets Smarter Over Time

```
Month 1:  Upload statements → 60% auto-categorised, 40% needs review
          You correct 40% manually → engine learns

Month 2:  Upload statements → 75% auto-categorised, 25% needs review
          Feedback loop creates new rules

Month 3:  Upload statements → 85% auto-categorised, 15% needs review
          Patterns are well established

Month 6:  Upload statements → 95%+ auto-categorised
          Only genuinely new merchants need review
```

The more statements you process and the more corrections you make, the less work you need to do.

---

## Understanding Confidence Scores

Every categorised transaction has a confidence score from 0% to 100%:

| Score | Meaning | Visual |
|-------|---------|--------|
| **95–100%** | Rule match or highly confident AI | ✅ Green |
| **80–94%** | Strong suggestion, likely correct | 🟢 Light green |
| **70–79%** | Reasonable guess, worth checking | 🟡 Yellow |
| **50–69%** | Uncertain, probably needs review | 🟠 Orange |
| **< 50%** | Low confidence, definitely review | 🔴 Red |

---

## HMRC & Companies House Awareness

The engine isn't just categorising for bookkeeping — it understands **UK tax law**:

### For Self-Employed / Sole Traders (HMRC SA103):
- Maps expenses to HMRC Self Assessment boxes (e.g. Box 17: Car/Van expenses, Box 20: Telephone costs)
- Identifies **allowable expenses** that reduce your tax bill
- Flags potentially **non-deductible** personal expenses

### For Limited Companies (Companies House / CT600):
- Separates director expenses from company expenses
- Maps to Corporation Tax categories
- Identifies VAT-relevant transactions

The engine automatically adapts based on your entity type (sole trader, partnership, or limited company).

---

## Tips for Best Results

### ✅ Do:
1. **Correct wrong categories promptly** — this trains the Feedback Loop
2. **Use consistent category names** — don't create "Travel" and "Transport" for the same thing
3. **Review the Smart Rules page** occasionally — delete outdated rules
4. **Start with Smart Mode** — switch to Autonomous once you're confident

### ❌ Don't:
1. **Don't ignore "Needs Review" flags** — uncategorised transactions affect your tax reports
2. **Don't create overly specific rules** — "TESCO EXTRA KENSINGTON" is too narrow; "TESCO" covers all stores
3. **Don't worry about mistakes** — you can always recategorise, and the engine will learn from the correction

---

## Frequently Asked Questions

### Q: Can I turn off AI categorisation?
**A:** Yes — set your mode to **Conservative** and the AI will still suggest categories, but nothing will be auto-approved. You keep full control.

### Q: Does the AI see my actual bank balance or account details?
**A:** No. The AI only receives the transaction **description**, **amount**, and **type** (income/expense). It never sees your account number, sort code, balance, or personal details.

### Q: How do I delete a learned rule?
**A:** Go to **Smart Rules** in the sidebar. Find the rule (filter by "Auto-learned" source) and click the delete button.

### Q: What happens if I change entity type (e.g. sole trader → limited company)?
**A:** The engine automatically switches to the correct category set and HMRC/Companies House mappings. Your learned rules are kept, but the AI prompts change to match the new entity type.

### Q: Can I create my own rules without waiting for the Feedback Loop?
**A:** Absolutely. Go to **Smart Rules** → **New Rule**. Enter a keyword (e.g. "AMAZON"), select a category, and save. The rule takes effect immediately.

### Q: What if two rules conflict?
**A:** Rules are applied by **priority** (highest first) and **specificity** (exact match > keyword > regex). If there's still a tie, the most recently used rule wins.

### Q: Is there a limit to how many rules I can have?
**A:** No. The system handles thousands of rules efficiently. More rules = faster categorisation = less AI usage.

---

## Summary

| Layer | Speed | Accuracy | Learns? |
|-------|-------|----------|---------|
| **1. Rules** | ⚡ Instant | 100% | From you (manual + feedback) |
| **2. Patterns** | ⚡ Instant | 70–95% | From your corrections |
| **3. AI** | 🕐 1–3 seconds | 60–95% | From UK accounting training data |
| **4. Feedback** | 🔄 After 3 corrections | Creates 100% rules | Self-improving |

**The goal:** Over time, nearly all your transactions are categorised instantly by rules, the AI handles only genuinely new merchants, and you rarely need to intervene.

---

*This guide is part of HomeLedger — UK Household Finance Hub.*
*For technical details, see the source code in `lib/categorization-engine.ts`.*
