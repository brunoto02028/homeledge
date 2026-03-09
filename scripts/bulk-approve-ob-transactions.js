const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find all bank transactions that:
  // 1. Come from Open Banking (statement has a bankConnection via fileName pattern)
  // 2. Have a category assigned (categoryId != null)
  // 3. Are NOT yet approved
  // 4. Have confidence >= 0.85 OR were keyword-matched

  // All statements from Open Banking have fileName like "MONZO-xxx-2025-01.json"
  // They were created by getOrCreateMonthlyStatement which uses .json extension
  const obStatements = await p.bankStatement.findMany({
    where: { fileName: { endsWith: '.json' } },
    select: { id: true }
  });
  const obStmtIds = obStatements.map(s => s.id);
  console.log('Open Banking statements:', obStmtIds.length);

  // Count before
  const beforePending = await p.bankTransaction.count({
    where: { statementId: { in: obStmtIds }, categoryId: { not: null }, isApproved: false }
  });
  const beforeApproved = await p.bankTransaction.count({
    where: { statementId: { in: obStmtIds }, isApproved: true }
  });
  console.log('Before: ' + beforeApproved + ' approved, ' + beforePending + ' pending (with category)');

  // Approve all categorised Open Banking transactions with confidence >= 0.85
  const result = await p.bankTransaction.updateMany({
    where: {
      statementId: { in: obStmtIds },
      categoryId: { not: null },
      isApproved: false,
      OR: [
        { confidenceScore: { gte: 0.85 } },
        { confidenceScore: null }, // Legacy txs without confidence score
      ]
    },
    data: { isApproved: true, needsReview: false }
  });
  console.log('Bulk approved: ' + result.count + ' transactions');

  // Count after
  const afterPending = await p.bankTransaction.count({
    where: { statementId: { in: obStmtIds }, categoryId: { not: null }, isApproved: false }
  });
  const afterApproved = await p.bankTransaction.count({
    where: { statementId: { in: obStmtIds }, isApproved: true }
  });
  console.log('After: ' + afterApproved + ' approved, ' + afterPending + ' still pending');

  // Show Business Income specifically
  const biCat = await p.category.findFirst({ where: { name: 'Business Income' } });
  if (biCat) {
    const biApproved = await p.bankTransaction.count({ where: { categoryId: biCat.id, isApproved: true } });
    const biTotal = await p.bankTransaction.count({ where: { categoryId: biCat.id } });
    console.log('\nBusiness Income: ' + biApproved + '/' + biTotal + ' approved');
  }

  // Show Benefits specifically
  const benCat = await p.category.findFirst({ where: { name: 'Benefits' } });
  if (benCat) {
    const benApproved = await p.bankTransaction.count({ where: { categoryId: benCat.id, isApproved: true } });
    const benTotal = await p.bankTransaction.count({ where: { categoryId: benCat.id } });
    console.log('Benefits: ' + benApproved + '/' + benTotal + ' approved');
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
