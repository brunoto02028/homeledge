# Audit Report: Categorisation Engine — Entity Scoping

**Date:** 2026-03-04  
**Auditor:** Cascade AI  
**Severity:** Critical — cross-entity data contamination  
**Status:** ✅ All issues fixed and deployed

---

## Executive Summary

The categorisation engine had **6 critical bugs** where rules, feedback, and auto-learning were **not scoped by entity**. This meant:

- A rule created for **Company A (Ltd)** would incorrectly match transactions from **Company B (Sole Trader)**
- User corrections on one entity would influence categorisation of another entity
- Auto-learned rules could be created from corrections across different entities
- Reports could show incorrect tax categorisations (e.g., Corporation Tax rules applied to Self Assessment)

---

## Bugs Found & Fixed

### BUG 1: Layer 1 (Deterministic Rules) — No entity filtering
- **File:** `lib/categorization-engine.ts` → `matchDeterministicRule()`
- **Before:** `where.OR = [{ userId: null }, { userId }]` — loaded ALL rules regardless of entity
- **Impact:** A rule for Entity A would match Entity B's transactions
- **Fix:** Tiered loading: `entity-specific → user-global → system-global`, with entity rules sorted first

### BUG 2: Layer 2 (Smart Patterns) — No entity filtering on feedback
- **File:** `lib/categorization-engine.ts` → `matchSmartPattern()`
- **Before:** `where: { userId, source: 'user_correction' }` — used ALL feedback
- **Impact:** Feedback from a Ltd company influenced Sole Trader categorisation
- **Fix:** Filter feedback by `entityId` first, fallback to user-global (`entityId: null`) if none found

### BUG 3: Layer 4 (Auto-Learning) — Cross-entity correction counting
- **File:** `lib/categorization-engine.ts` → `recordFeedback()`
- **Before:** Counted corrections across ALL entities — 1 correction from 3 different entities = auto-rule
- **Impact:** Premature auto-rule creation with wrong entity scope
- **Fix:** Count corrections scoped by `entityId`. 3+ corrections must be from the SAME entity.

### BUG 4: Layer 4 (Auto-Learning) — Rule existence check ignoring entity
- **File:** `lib/categorization-engine.ts` → `recordFeedback()`
- **Before:** `findFirst({ where: { keyword, userId, categoryId } })` — no entityId check
- **Impact:** Could skip creating entity-specific rule because a global rule existed
- **Fix:** Added `entityId` to the existence check

### BUG 5: API GET — No entity filter
- **File:** `app/api/categorization-rules/route.ts`
- **Before:** Returned ALL user rules, no way to filter by entity
- **Impact:** UI showed rules from all entities mixed together
- **Fix:** Added `?entityId=` query parameter with tiered visibility

### BUG 6: Transaction categorise endpoint — Missing entityId in feedback
- **File:** `app/api/statements/transactions/[id]/categorize/route.ts`
- **Before:** `recordFeedback({ userId, ... })` — no entityId passed
- **Impact:** Manual corrections were recorded without entity context, polluting global feedback
- **Fix:** Include `statement.entityId` in the query, pass to `recordFeedback()`

---

## UI Improvements

### Smart Rules Page (`app/categorization-rules/page.tsx`)
- **Entity filter dropdown** — filter rules by entity or see all
- **Entity scope badge** — each rule shows:
  - 🏢 **Building2 icon + entity name** (indigo) = scoped to specific entity
  - 🌐 **Globe icon + "All"** (slate) = applies to all user's entities
  - No badge = system rule (applies globally)
- **Create form** — new rules are automatically scoped to the selected entity filter
- **Legend** — updated with entity scope explanations

---

## Architecture: Rule Precedence

When categorising a transaction, rules are evaluated in this order:

```
1. Entity-specific rules (entityId matches transaction's entity)
   ├── Exact match
   ├── Starts with
   ├── Contains
   └── Regex

2. User-global rules (userId matches, entityId = null)
   ├── Exact match
   ├── Starts with
   ├── Contains
   └── Regex

3. System rules (userId = null, entityId = null)
   ├── Exact match
   ├── Starts with
   ├── Contains
   └── Regex
```

This means: **"TESCO" in Entity A → Staff Welfare** (entity rule) takes priority over **"TESCO" → Groceries** (global rule).

---

## Files Modified

| File | Change |
|------|--------|
| `lib/categorization-engine.ts` | Layer 1, 2, 4 — entity scoping |
| `app/api/categorization-rules/route.ts` | GET — entityId filter |
| `app/api/statements/transactions/[id]/categorize/route.ts` | Pass entityId to recordFeedback |
| `app/categorization-rules/page.tsx` | Entity filter, badges, create form scope |

---

## Impact on Existing Data

- **Existing rules** with `entityId = null` continue to work as before (user-global)
- **Existing feedback** with `entityId = null` continues to work (user-global fallback)
- **No data migration needed** — the changes are backwards-compatible
- **Auto-learned rules** will now correctly scope to the entity where corrections happened

---

## Recommendations for Future

1. **Entity-specific categories** — allow entities to have custom category trees (e.g., Corporation Tax categories vs Self Assessment)
2. **Rule cloning** — ability to clone a global rule to an entity-specific override
3. **Conflict detection** — warn when entity rule contradicts a global rule
4. **Metrics per entity** — show correction rate and auto-learning stats per entity
