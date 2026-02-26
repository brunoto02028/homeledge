import { prisma } from '@/lib/db';
import {
  getAccounts,
  getBalance,
  getTransactions,
  type TrueLayerTransaction,
} from '@/lib/truelayer';
import { callAI } from '@/lib/ai-client';

/**
 * Get or create a monthly bank statement for a connection.
 *
 * Ensures one statement per bank per entity per month. Uses entity-scoped
 * filenames (e.g. `MONZO-cmm0lcy2-2025-07.json`) to prevent cross-entity mixing.
 *
 * @param bankName - Display name of the bank (e.g. `'MONZO'`, `'HSBC'`)
 * @param month - Month in `YYYY-MM` format
 * @param userId - Owner user ID
 * @param accountId - Linked Account ID (nullable)
 * @param entityId - Entity ID for entity-scoped statements (nullable)
 * @param connId - BankConnection ID for the cloud storage path
 * @returns Statement ID (existing or newly created)
 */
export async function getOrCreateMonthlyStatement(
  bankName: string,
  month: string,
  userId: string,
  accountId: string | null,
  entityId: string | null,
  connId: string,
): Promise<string> {
  // Include entityId in fileName to prevent cross-entity statement reuse
  const entitySuffix = entityId ? `-${entityId.substring(0, 8)}` : '';
  const fileName = `${bankName}${entitySuffix}-${month}.json`;

  // Also try to find old-format statements for this entity (migration)
  const oldFileName = `${bankName}-${month}.json`;
  const where: any = { userId, fileName };
  const existing = await prisma.bankStatement.findFirst({
    where,
    select: { id: true },
  });
  if (existing) return existing.id;

  // Check if old-format exists with CORRECT entity — reuse it
  if (entityId) {
    const oldExisting = await prisma.bankStatement.findFirst({
      where: { userId, fileName: oldFileName, entityId },
      select: { id: true },
    });
    if (oldExisting) return oldExisting.id;
  }

  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0);

  const statement = await prisma.bankStatement.create({
    data: {
      accountId,
      userId,
      entityId,
      fileName,
      cloudStoragePath: `open-banking/${connId}/${month}`,
      statementDate: new Date(),
      periodStart: monthStart,
      periodEnd: monthEnd,
      totalCredits: 0,
      totalDebits: 0,
      parseStatus: 'success',
    } as any,
  });

  return statement.id;
}

/**
 * Ensure the BankConnection has a linked Account record.
 *
 * If no Account exists, auto-creates a Provider (if needed) and an Account
 * under it. Updates the BankConnection with the new `accountId`.
 *
 * @param conn - The BankConnection record (must have `id`, `accountId`, `entityId`)
 * @param bankName - Display name of the bank for the Provider record
 * @param userId - Owner user ID
 * @returns The Account ID, or `null` if creation failed
 */
export async function ensureAccountLinked(
  conn: any,
  bankName: string,
  userId: string,
): Promise<string | null> {
  if (conn.accountId) return conn.accountId;

  try {
    let provider = await prisma.provider.findFirst({
      where: { userId, name: bankName },
    });
    if (!provider) {
      provider = await prisma.provider.create({
        data: { name: bankName, type: 'bank' as any, userId },
      });
    }

    const account = await prisma.account.create({
      data: {
        providerId: provider.id,
        entityId: conn.entityId || null,
        accountName: `${bankName} Current Account`,
        accountType: 'current' as any,
        currency: 'GBP',
        isActive: true,
      },
    });

    await (prisma as any).bankConnection.update({
      where: { id: conn.id },
      data: { accountId: account.id },
    });

    return account.id;
  } catch (err) {
    console.error('[Sync] Error creating account:', err);
    return null;
  }
}

/**
 * Auto-categorise a batch of new transactions using AI.
 *
 * Loads categories filtered by entity regime (HMRC/Companies House/Universal),
 * then batches transactions in groups of 20 for AI classification.
 * Auto-applies categories with ≥ 85% confidence.
 *
 * @param transactionIds - Array of BankTransaction IDs to categorise
 * @param entityId - Entity ID for regime-aware category filtering (nullable)
 * @param userId - Owner user ID
 * @returns Number of transactions successfully categorised
 */
export async function autoCategorizeTransactions(
  transactionIds: string[],
  entityId: string | null,
  userId: string,
): Promise<number> {
  try {
    const transactions = await prisma.bankTransaction.findMany({
      where: { id: { in: transactionIds } },
      select: { id: true, description: true, amount: true, type: true, date: true },
    });

    if (transactions.length === 0) return 0;

    let entityRegime = 'universal';
    if (entityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { type: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* default */ }
    }

    const catWhere: any = entityRegime !== 'universal'
      ? { taxRegime: { in: [entityRegime, 'universal'] } }
      : {};
    const categories: any[] = await (prisma as any).category.findMany({
      where: catWhere,
      select: { id: true, name: true, type: true, hmrcMapping: true },
    });

    const catMap = new Map(categories.map((c: any) => [c.id, c]));
    const catList = categories.map((c: any) =>
      `"${c.name}" (ID: ${c.id}, type: ${c.type}${c.hmrcMapping && c.hmrcMapping !== 'none' ? ', HMRC: ' + c.hmrcMapping : ''})`
    ).join('\n');

    const batchSize = 20;
    let totalCategorised = 0;

    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      const txLines = batch.map((tx, idx) =>
        `${idx + 1}. "${tx.description}" | £${tx.amount} | ${tx.type === 'credit' ? 'INCOME' : 'EXPENSE'} | ${new Date(tx.date).toISOString().split('T')[0]}`
      ).join('\n');

      const prompt = `You are a UK accountant. Categorise these bank transactions into the best matching category.

CATEGORIES:
${catList}

TRANSACTIONS:
${txLines}

Return a JSON array with objects: [{"index": 1, "categoryId": "...", "confidence": 0.9}]
Only return the JSON array, no markdown.`;

      try {
        const result = await callAI([{ role: 'user', content: prompt }], { maxTokens: 2000, temperature: 0.1, preferAbacus: true });
        let content = (result.content || '').trim();
        if (content.startsWith('```')) {
          content = content.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
        }

        const suggestions: { index: number; categoryId: string; confidence: number }[] = JSON.parse(content);

        for (const s of suggestions) {
          const tx = batch[s.index - 1];
          if (!tx || !s.categoryId || !catMap.has(s.categoryId)) continue;

          await prisma.bankTransaction.update({
            where: { id: tx.id },
            data: {
              suggestedCategoryId: s.categoryId,
              categoryId: s.confidence >= 0.85 ? s.categoryId : undefined,
              confidenceScore: s.confidence,
              needsReview: s.confidence < 0.85,
              isApproved: false,
            },
          });
          totalCategorised++;
        }
      } catch (err) {
        console.error('[AutoCategorise] Batch error:', err);
      }
    }

    return totalCategorised;
  } catch (error) {
    console.error('[AutoCategorise] Error:', error);
    return 0;
  }
}

/**
 * Core sync logic — fetches transactions from TrueLayer and saves to DB.
 *
 * Used by:
 * - **Callback** (on connect): syncs 24 months of history
 * - **Manual refresh**: incremental from `lastSyncAt` to now
 * - **Cron** (3x/day): incremental with 1-day buffer
 *
 * Features:
 * - Entity-scoped deduplication (prevents cross-entity blocking)
 * - Monthly statement grouping (one per bank per entity per month)
 * - Auto-categorisation of new transactions
 * - SCA error handling with friendly fallback if recently synced
 *
 * @param params - Connection details and date range
 * @param params.connectionId - BankConnection ID
 * @param params.accessToken - TrueLayer access token
 * @param params.userId - Owner user ID
 * @param params.fromDate - Start date in `YYYY-MM-DD` format
 * @param params.toDate - End date in `YYYY-MM-DD` format
 * @returns Sync results including counts, balance, and any errors
 */
export async function syncConnectionTransactions(params: {
  connectionId: string;
  accessToken: string;
  userId: string;
  fromDate: string;  // ISO date string "YYYY-MM-DD"
  toDate: string;    // ISO date string "YYYY-MM-DD"
}): Promise<{
  synced: number;
  skipped: number;
  categorised: number;
  total: number;
  months: string[];
  balance: number;
  bank: string;
  period: { from: string; to: string };
  error?: string;
  code?: string;
}> {
  const { connectionId, accessToken, userId, fromDate, toDate } = params;

  const conn = await (prisma as any).bankConnection.findFirst({
    where: { id: connectionId },
  });

  if (!conn) throw new Error('Connection not found');

  // Fetch accounts from TrueLayer
  const tlAccounts = await getAccounts(accessToken);
  if (tlAccounts.length === 0) throw new Error('No accounts found');

  const targetAccount = conn.truelayerAccountId
    ? tlAccounts.find((a: any) => a.account_id === conn.truelayerAccountId) || tlAccounts[0]
    : tlAccounts[0];

  const bankName = targetAccount.provider.display_name || 'BANK';

  // Ensure Account is linked
  const accountId = await ensureAccountLinked(conn, bankName, userId);

  // Fetch balance
  let currentBalance = 0;
  try {
    const balances = await getBalance(accessToken, targetAccount.account_id);
    if (balances.length > 0) {
      currentBalance = balances[0].current;
      if (accountId) {
        await prisma.account.update({
          where: { id: accountId },
          data: { balance: currentBalance },
        });
      }
    }
  } catch { /* balance fetch is optional */ }

  // Fetch transactions
  let transactions: TrueLayerTransaction[];
  try {
    transactions = await getTransactions(accessToken, targetAccount.account_id, fromDate, toDate);
  } catch (txErr: any) {
    if (txErr.code === 'SCA_EXCEEDED') {
      // If there was a recent successful sync (within 24h), don't overwrite with scary SCA error
      const recentSync = conn.lastSyncAt && (Date.now() - new Date(conn.lastSyncAt).getTime()) < 24 * 60 * 60 * 1000;
      if (recentSync) {
        // Don't overwrite lastSyncError — keep it clean
        return {
          synced: 0, skipped: 0, categorised: 0, total: 0,
          months: [], balance: currentBalance, bank: bankName,
          period: { from: fromDate, to: toDate },
          error: 'ALREADY_SYNCED', code: 'ALREADY_SYNCED',
        };
      }
      await (prisma as any).bankConnection.update({
        where: { id: conn.id },
        data: { lastSyncError: 'SCA expired — reconnect bank for historical data' },
      });
      return {
        synced: 0, skipped: 0, categorised: 0, total: 0,
        months: [], balance: currentBalance, bank: bankName,
        period: { from: fromDate, to: toDate },
        error: 'SCA_EXCEEDED', code: 'SCA_EXCEEDED',
      };
    }
    throw txErr;
  }

  if (transactions.length === 0) {
    await (prisma as any).bankConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), lastSyncError: null },
    });
    return {
      synced: 0, skipped: 0, categorised: 0, total: 0,
      months: [], balance: currentBalance, bank: bankName,
      period: { from: fromDate, to: toDate },
    };
  }

  // Deduplication — scoped to THIS entity's statements to prevent cross-entity blocking
  const tlTransactionIds = transactions.map((t: any) => t.transaction_id);
  const entityStatementIds = await prisma.bankStatement.findMany({
    where: conn.entityId ? { entityId: conn.entityId } : { userId },
    select: { id: true },
  });
  const stmtIds = entityStatementIds.map((s: any) => s.id);
  const existingTxs = stmtIds.length > 0
    ? await prisma.bankTransaction.findMany({
        where: { reference: { in: tlTransactionIds }, statementId: { in: stmtIds } },
        select: { reference: true },
      })
    : [];
  const existingRefs = new Set(existingTxs.map((t: any) => t.reference));
  const newTransactions = transactions.filter((t: any) => !existingRefs.has(t.transaction_id));
  const skippedCount = transactions.length - newTransactions.length;

  if (newTransactions.length === 0) {
    await (prisma as any).bankConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date(), lastSyncError: null },
    });
    return {
      synced: 0, skipped: skippedCount, categorised: 0, total: transactions.length,
      months: [], balance: currentBalance, bank: bankName,
      period: { from: fromDate, to: toDate },
    };
  }

  // Group by month
  const txByMonth = new Map<string, TrueLayerTransaction[]>();
  for (const tx of newTransactions) {
    const month = tx.timestamp.substring(0, 7);
    if (!txByMonth.has(month)) txByMonth.set(month, []);
    txByMonth.get(month)!.push(tx);
  }

  // Insert transactions
  let newCount = 0;
  const newTxIds: string[] = [];

  for (const [month, monthTxs] of txByMonth) {
    const statementId = await getOrCreateMonthlyStatement(
      bankName, month, userId, accountId, conn.entityId, conn.id,
    );

    for (const tx of monthTxs) {
      const txDate = new Date(tx.timestamp);
      const amount = Math.abs(tx.amount);
      const type = tx.transaction_type === 'CREDIT' ? 'credit' : 'debit';
      const description = tx.merchant_name || tx.description || 'Unknown';

      try {
        const created = await prisma.bankTransaction.create({
          data: {
            statementId,
            date: txDate,
            description,
            cleanDescription: tx.merchant_name || null,
            reference: tx.transaction_id,
            amount,
            type: type as any,
            balance: tx.running_balance?.amount ?? null,
            needsReview: true,
            isApproved: false,
          },
        });
        newTxIds.push(created.id);
        newCount++;
      } catch (err: any) {
        if (err.code === 'P2002') continue;
        console.error('[Sync] Error inserting transaction:', err.message);
      }
    }

    // Update statement totals
    const stmtTxs = await prisma.bankTransaction.findMany({
      where: { statementId },
      select: { amount: true, type: true },
    });
    await prisma.bankStatement.update({
      where: { id: statementId },
      data: {
        totalCredits: stmtTxs.filter((t: any) => t.type === 'credit').reduce((s: number, t: any) => s + t.amount, 0),
        totalDebits: stmtTxs.filter((t: any) => t.type === 'debit').reduce((s: number, t: any) => s + t.amount, 0),
        closingBalance: currentBalance || null,
      } as any,
    });
  }

  // Auto-categorise
  let categorised = 0;
  if (conn.autoCategories && newCount > 0) {
    categorised = await autoCategorizeTransactions(newTxIds, conn.entityId, userId);
  }

  // Update connection
  await (prisma as any).bankConnection.update({
    where: { id: conn.id },
    data: {
      lastSyncAt: new Date(),
      lastSyncError: null,
      bankName,
      truelayerAccountId: targetAccount.account_id,
    },
  });

  return {
    synced: newCount,
    skipped: skippedCount,
    categorised,
    total: transactions.length,
    months: Array.from(txByMonth.keys()),
    balance: currentBalance,
    bank: bankName,
    period: { from: fromDate, to: toDate },
  };
}
