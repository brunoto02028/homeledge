const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== DUPLICATE BANK STATEMENT CHECK ===\n');

  // 1. Get all bank statements
  const statements = await prisma.bankStatement.findMany({
    include: {
      entity: { select: { id: true, name: true } },
      user: { select: { id: true, email: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Total statements: ${statements.length}\n`);

  // 2. List all statements with details
  console.log('--- ALL STATEMENTS ---');
  for (const s of statements) {
    console.log(`  [${s.id}] "${s.fileName}" | Entity: ${s.entity?.name || 'N/A'} | Period: ${s.periodStart?.toISOString().slice(0,10) || '?'} - ${s.periodEnd?.toISOString().slice(0,10) || '?'} | Txns: ${s._count.transactions} | Credits: £${s.totalCredits.toFixed(2)} | Debits: £${s.totalDebits.toFixed(2)} | Created: ${s.createdAt.toISOString().slice(0,16)}`);
  }

  // 3. Check for duplicate statements (same fileName)
  console.log('\n--- DUPLICATE FILE NAMES ---');
  const fileNameGroups = {};
  for (const s of statements) {
    const key = `${s.fileName}|${s.entityId || 'none'}`;
    if (!fileNameGroups[key]) fileNameGroups[key] = [];
    fileNameGroups[key].push(s);
  }
  let dupFileCount = 0;
  for (const [key, group] of Object.entries(fileNameGroups)) {
    if (group.length > 1) {
      dupFileCount++;
      console.log(`  DUPLICATE fileName: "${group[0].fileName}" (entity: ${group[0].entity?.name || 'N/A'}) - ${group.length} copies`);
      for (const s of group) {
        console.log(`    -> ID: ${s.id} | Txns: ${s._count.transactions} | Created: ${s.createdAt.toISOString().slice(0,16)}`);
      }
    }
  }
  if (dupFileCount === 0) console.log('  No duplicate file names found.');

  // 4. Check for overlapping periods (same entity, overlapping dates)
  console.log('\n--- OVERLAPPING PERIODS (same entity) ---');
  const entityGroups = {};
  for (const s of statements) {
    const key = s.entityId || 'personal';
    if (!entityGroups[key]) entityGroups[key] = [];
    entityGroups[key].push(s);
  }
  let overlapCount = 0;
  for (const [entityId, group] of Object.entries(entityGroups)) {
    const entityName = group[0].entity?.name || 'Personal';
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i];
        const b = group[j];
        if (a.periodStart && a.periodEnd && b.periodStart && b.periodEnd) {
          if (a.periodStart <= b.periodEnd && b.periodStart <= a.periodEnd) {
            // Check if same bank (from fileName prefix)
            const bankA = a.fileName.split('-')[0];
            const bankB = b.fileName.split('-')[0];
            if (bankA === bankB) {
              overlapCount++;
              console.log(`  OVERLAP (${entityName}, ${bankA}):`);
              console.log(`    A: "${a.fileName}" [${a.periodStart.toISOString().slice(0,10)} - ${a.periodEnd.toISOString().slice(0,10)}] ${a._count.transactions} txns`);
              console.log(`    B: "${b.fileName}" [${b.periodStart.toISOString().slice(0,10)} - ${b.periodEnd.toISOString().slice(0,10)}] ${b._count.transactions} txns`);
            }
          }
        }
      }
    }
  }
  if (overlapCount === 0) console.log('  No overlapping periods found.');

  // 5. Check for duplicate transactions across statements
  console.log('\n--- DUPLICATE TRANSACTIONS (cross-statement) ---');
  const allTxns = await prisma.bankTransaction.findMany({
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      type: true,
      statementId: true,
      statement: { select: { fileName: true, entityId: true } },
    },
    orderBy: { date: 'desc' },
  });

  console.log(`Total transactions: ${allTxns.length}`);

  const txnGroups = {};
  for (const tx of allTxns) {
    const key = `${tx.date.toISOString().slice(0,10)}|${tx.description}|${tx.amount}|${tx.type}|${tx.statement.entityId || 'none'}`;
    if (!txnGroups[key]) txnGroups[key] = [];
    txnGroups[key].push(tx);
  }

  let dupTxnCount = 0;
  const dupTxnDetails = [];
  for (const [key, group] of Object.entries(txnGroups)) {
    if (group.length > 1) {
      // Only flag if they're in DIFFERENT statements
      const stmtIds = new Set(group.map(t => t.statementId));
      if (stmtIds.size > 1) {
        dupTxnCount += group.length - 1;
        dupTxnDetails.push({
          count: group.length,
          date: group[0].date.toISOString().slice(0,10),
          desc: group[0].description.substring(0, 60),
          amount: group[0].amount,
          type: group[0].type,
          statements: group.map(t => t.statement.fileName),
        });
      }
    }
  }

  if (dupTxnDetails.length > 0) {
    console.log(`  Found ${dupTxnCount} duplicate transactions across ${dupTxnDetails.length} groups:\n`);
    for (const d of dupTxnDetails.slice(0, 50)) {
      console.log(`  [${d.date}] ${d.desc} | £${d.amount.toFixed(2)} (${d.type}) x${d.count}`);
      console.log(`    In statements: ${d.statements.join(', ')}`);
    }
    if (dupTxnDetails.length > 50) {
      console.log(`  ... and ${dupTxnDetails.length - 50} more groups`);
    }
  } else {
    console.log('  No cross-statement duplicate transactions found.');
  }

  // 6. Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Statements: ${statements.length}`);
  console.log(`Transactions: ${allTxns.length}`);
  console.log(`Duplicate file names: ${dupFileCount}`);
  console.log(`Overlapping periods: ${overlapCount}`);
  console.log(`Cross-statement duplicate transactions: ${dupTxnCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
