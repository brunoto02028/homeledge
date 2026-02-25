import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const entityId = searchParams.get('entityId');
    const accountId = searchParams.get('accountId');

    const dateFilter = {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    };

    // Determine entity regime for report context
    let entityRegime = 'hmrc';
    let entityName = '';
    if (entityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { type: true, name: true, taxRegime: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
          entityName = entity.name;
        }
      } catch { /* default hmrc */ }
    }

    // Build entity filter for queries
    const entityFilter = entityId ? { entityId } : {};
    // Build account filter
    const accountFilter = accountId ? { accountId } : {};

    // Fetch data based on report type
    let reportData: Record<string, unknown> = {
      entityRegime,
      entityName: entityName || null,
      entityId: entityId || null,
    };

    if (type === 'summary' || type === 'all') {
      // Step 1: Get statement IDs filtered by entity/account (avoids relation filter issues)
      const stmtWhere: any = { userId: { in: userIds } };
      if (entityId) stmtWhere.entityId = entityId;
      if (accountId) stmtWhere.accountId = accountId;
      const statementsForFilter = await prisma.bankStatement.findMany({
        where: stmtWhere,
        select: { id: true },
      });
      const statementIds = statementsForFilter.map(s => s.id);

      // Step 2: Fetch all data using statementIds for transaction filtering
      const [bills, invoices, categories, transactions, accounts] = await Promise.all([
        prisma.bill.findMany({
          where: { isActive: true, userId: { in: userIds }, ...entityFilter, ...accountFilter },
          include: { category: true, account: { include: { provider: true } } },
        }),
        prisma.invoice.findMany({
          where: { userId: { in: userIds }, ...entityFilter, ...(startDate || endDate ? { invoiceDate: dateFilter } : {}) },
          include: { category: true },
        }),
        prisma.category.findMany({
          where: entityId ? { taxRegime: { in: [entityRegime, 'universal'] } } as any : undefined,
        }),
        prisma.bankTransaction.findMany({
          where: {
            statementId: { in: statementIds },
            ...(startDate || endDate ? { date: dateFilter } : {}),
          },
          include: { category: true, statement: { select: { accountId: true, entityId: true, account: { select: { id: true, accountName: true } } } } },
        }),
        prisma.account.findMany({
          where: { provider: { userId: { in: userIds } }, ...(entityId ? { entityId } : {}), isActive: true },
          include: { provider: { select: { name: true } } },
          orderBy: { accountName: 'asc' },
        }),
      ]);

      // Calculate totals by category type
      const expenseCategories = categories.filter(c => c.type === 'expense');
      const incomeCategories = categories.filter(c => c.type === 'income');

      // Monthly commitments by category
      const monthlyByCategory = expenseCategories.map(cat => {
        const categoryBills = bills.filter(b => b.categoryId === cat.id);
        const total = categoryBills.reduce((sum, bill) => {
          const multiplier = bill.frequency === 'yearly' ? 1/12 : 
                            bill.frequency === 'quarterly' ? 1/3 : 
                            bill.frequency === 'weekly' ? 4 : 1;
          return sum + (bill.amount * multiplier);
        }, 0);
        return { category: cat.name, type: cat.type, color: cat.color, amount: Math.round(total * 100) / 100 };
      }).filter(c => c.amount > 0);

      // Invoice totals - only count invoices with categories assigned
      // Also filter out bank statement invoices (they have extractedData.transactions)
      const invoiceTotals = invoices.reduce((acc, inv) => {
        // Skip bank statements (they have transactions array in extractedData)
        const hasTransactions = inv.extractedData && 
          typeof inv.extractedData === 'object' && 
          'transactions' in (inv.extractedData as Record<string, unknown>);
        if (hasTransactions) return acc;
        
        // Only count invoices with valid amounts and categories
        if (!inv.amount || inv.amount <= 0) return acc;
        
        if (inv.category?.type === 'income') {
          acc.totalIncome += inv.amount;
        } else if (inv.category?.type === 'expense') {
          acc.totalExpenses += inv.amount;
        }
        // If no category, don't count it in totals
        return acc;
      }, { totalIncome: 0, totalExpenses: 0 });

      // Transaction totals
      const transactionTotals = transactions.reduce((acc, tx) => {
        if (tx.type === 'credit') {
          acc.credits += tx.amount;
        } else {
          acc.debits += tx.amount;
        }
        return acc;
      }, { credits: 0, debits: 0 });

      reportData = {
        summary: {
          totalMonthlyCommitments: monthlyByCategory.reduce((sum, c) => sum + c.amount, 0),
          totalActiveBills: bills.length,
          totalInvoices: invoices.length,
          invoiceTotals,
          transactionTotals,
          categoryBreakdown: monthlyByCategory,
          expenseCategoryCount: expenseCategories.length,
          incomeCategoryCount: incomeCategories.length,
          totalCredits: transactionTotals.credits,
          totalDebits: transactionTotals.debits,
          totalTransactions: transactions.length,
        },
        accounts: accounts.map(a => ({ id: a.id, name: a.accountName, bank: a.provider?.name || '' })),
        entityRegime,
        entityName: entityName || null,
        dateRange: { startDate, endDate },
        generatedAt: new Date().toISOString(),
      };
    }

    if (type === 'bills' || type === 'all') {
      const bills = await prisma.bill.findMany({
        where: { isActive: true, userId: { in: userIds }, ...entityFilter },
        include: { category: true, account: { include: { provider: true } } },
        orderBy: [{ dueDay: 'asc' }],
      });

      reportData.bills = bills.map(bill => ({
        id: bill.id,
        billName: bill.billName,
        provider: bill.account?.provider?.name || 'N/A',
        category: bill.category?.name || 'Uncategorized',
        categoryType: bill.category?.type || 'expense',
        amount: bill.amount,
        currency: bill.currency,
        frequency: bill.frequency,
        expenseType: bill.expenseType,
        dueDay: bill.dueDay,
        monthlyEquivalent: bill.frequency === 'yearly' ? bill.amount / 12 :
                          bill.frequency === 'quarterly' ? bill.amount / 3 :
                          bill.frequency === 'weekly' ? bill.amount * 4 : bill.amount,
      }));
    }

    if (type === 'invoices' || type === 'all') {
      const invoices = await prisma.invoice.findMany({
        where: { userId: { in: userIds }, ...entityFilter, ...(startDate || endDate ? { invoiceDate: dateFilter } : {}) },
        include: { category: true },
        orderBy: [{ invoiceDate: 'desc' }],
      });

      reportData.invoices = invoices.map(inv => ({
        id: inv.id,
        fileName: inv.fileName,
        providerName: inv.providerName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate?.toISOString().split('T')[0],
        dueDate: inv.dueDate?.toISOString().split('T')[0],
        amount: inv.amount,
        currency: inv.currency,
        category: inv.category?.name || 'Uncategorized',
        categoryType: inv.category?.type || 'expense',
        expenseType: inv.expenseType,
        status: inv.status,
      }));
    }

    if (type === 'categories' || type === 'all') {
      const catFilter: any = entityId ? { taxRegime: { in: [entityRegime, 'universal'] } } : undefined;
      const categories = await prisma.category.findMany({
        where: catFilter,
        include: {
          _count: { select: { bills: true, invoices: true, bankTransactions: true } },
        },
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
      });

      reportData.categories = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type,
        description: cat.description,
        billCount: cat._count.bills,
        invoiceCount: cat._count.invoices,
        transactionCount: cat._count.bankTransactions,
        color: cat.color,
        isDefault: cat.isDefault,
      }));
    }

    if (type === 'statements' || type === 'all') {
      const statements = await prisma.bankStatement.findMany({
        where: { userId: { in: userIds }, ...entityFilter, ...(startDate || endDate ? { statementDate: dateFilter } : {}) },
        include: {
          account: { include: { provider: true } },
          transactions: { include: { category: true }, orderBy: { date: 'desc' } },
        },
        orderBy: { statementDate: 'desc' },
      });

      reportData.statements = statements.map(stmt => ({
        id: stmt.id,
        fileName: stmt.fileName,
        statementDate: stmt.statementDate?.toISOString().split('T')[0],
        periodStart: stmt.periodStart?.toISOString().split('T')[0],
        periodEnd: stmt.periodEnd?.toISOString().split('T')[0],
        accountName: stmt.account?.accountName || 'N/A',
        bankName: stmt.account?.provider?.name || 'N/A',
        totalCredits: Number(stmt.totalCredits),
        totalDebits: Number(stmt.totalDebits),
        openingBalance: Number(stmt.openingBalance),
        closingBalance: Number(stmt.closingBalance),
        transactionCount: stmt.transactions.length,
        transactions: stmt.transactions.map(tx => ({
          date: tx.date?.toISOString().split('T')[0],
          description: tx.description,
          amount: Number(tx.amount),
          type: tx.type,
          balance: Number(tx.balance),
          category: tx.category?.name || 'Uncategorized',
          isReconciled: tx.isReconciled,
        })),
      }));
    }

    if (type === 'providers' || type === 'all') {
      const providers = await prisma.provider.findMany({
        where: { userId: { in: userIds } },
        include: {
          _count: { select: { accounts: true } },
          accounts: { select: { id: true, accountName: true, accountNumber: true, isActive: true } },
        },
        orderBy: { name: 'asc' },
      });

      reportData.providers = providers.map(prov => ({
        id: prov.id,
        name: prov.name,
        type: prov.type,
        accountCount: prov._count.accounts,
        accounts: prov.accounts.map(acc => ({
          id: acc.id,
          name: acc.accountName,
          number: acc.accountNumber ? `****${acc.accountNumber.slice(-4)}` : 'N/A',
          isActive: acc.isActive,
        })),
      }));
    }

    // Format output
    if (format === 'csv') {
      let csvContent = '';
      
      if (type === 'bills' && reportData.bills) {
        const bills = reportData.bills as Array<Record<string, unknown>>;
        csvContent = 'Bill Name,Provider,Category,Category Type,Amount,Currency,Frequency,Expense Type,Due Day,Monthly Equivalent\n';
        csvContent += bills.map(b => 
          `"${b.billName}","${b.provider}","${b.category}","${b.categoryType}",${b.amount},${b.currency},${b.frequency},${b.expenseType},${b.dueDay},${b.monthlyEquivalent}`
        ).join('\n');
      } else if (type === 'invoices' && reportData.invoices) {
        const invoices = reportData.invoices as Array<Record<string, unknown>>;
        csvContent = 'Provider,Invoice Number,Invoice Date,Due Date,Amount,Currency,Category,Category Type,Expense Type,Status\n';
        csvContent += invoices.map(i => 
          `"${i.providerName || ''}","${i.invoiceNumber || ''}",${i.invoiceDate || ''},${i.dueDate || ''},${i.amount || 0},${i.currency},"${i.category}","${i.categoryType}",${i.expenseType || ''},${i.status}`
        ).join('\n');
      } else if (type === 'categories' && reportData.categories) {
        const categories = reportData.categories as Array<Record<string, unknown>>;
        csvContent = 'Name,Type,Description,Bill Count,Invoice Count,Transaction Count,Is Default\n';
        csvContent += categories.map(c => 
          `"${c.name}","${c.type}","${c.description || ''}",${c.billCount},${c.invoiceCount},${c.transactionCount || 0},${c.isDefault}`
        ).join('\n');
      } else if (type === 'statements' && reportData.statements) {
        const statements = reportData.statements as Array<Record<string, unknown>>;
        csvContent = 'File Name,Statement Date,Account,Bank,Total Credits,Total Debits,Opening Balance,Closing Balance,Transactions\n';
        csvContent += statements.map(s => 
          `"${s.fileName || ''}",${s.statementDate || ''},"${s.accountName}","${s.bankName}",${s.totalCredits},${s.totalDebits},${s.openingBalance},${s.closingBalance},${s.transactionCount}`
        ).join('\n');
        
        // Add transaction details
        csvContent += '\n\n--- Transaction Details ---\nDate,Description,Amount,Type,Balance,Category\n';
        statements.forEach((stmt: any) => {
          if (stmt.transactions) {
            stmt.transactions.forEach((tx: any) => {
              csvContent += `${tx.date || ''},"${tx.description}",${tx.amount},${tx.type},${tx.balance},"${tx.category}"\n`;
            });
          }
        });
      } else if (type === 'providers' && reportData.providers) {
        const providers = reportData.providers as Array<Record<string, unknown>>;
        csvContent = 'Name,Type,Account Count\n';
        csvContent += providers.map(p => 
          `"${p.name}","${p.type}",${p.accountCount}`
        ).join('\n');
        
        // Add account details
        csvContent += '\n\n--- Account Details ---\nProvider,Account Name,Account Number,Active\n';
        providers.forEach((prov: any) => {
          if (prov.accounts) {
            prov.accounts.forEach((acc: any) => {
              csvContent += `"${prov.name}","${acc.name}","${acc.number}",${acc.isActive ? 'Yes' : 'No'}\n`;
            });
          }
        });
      } else {
        // Summary CSV
        csvContent = 'HMRC-Ready Financial Summary Report\n';
        csvContent += `Generated: ${new Date().toISOString()}\n\n`;
        if (reportData.summary) {
          const summary = reportData.summary as Record<string, unknown>;
          csvContent += `Total Monthly Commitments,${summary.totalMonthlyCommitments}\n`;
          csvContent += `Total Active Bills,${summary.totalActiveBills}\n`;
          csvContent += `Total Invoices,${summary.totalInvoices}\n`;
          csvContent += `Expense Categories,${summary.expenseCategoryCount}\n`;
          csvContent += `Income Categories,${summary.incomeCategoryCount}\n\n`;
          
          if (Array.isArray(summary.categoryBreakdown)) {
            csvContent += 'Category,Type,Monthly Amount\n';
            csvContent += (summary.categoryBreakdown as Array<Record<string, unknown>>)
              .map(c => `"${c.category}","${c.type}",${c.amount}`).join('\n');
          }
        }
      }

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${type}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
