const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find Benefits and Business Income categories
  const cats = await p.category.findMany({
    where: { name: { in: ['Benefits', 'Business Income'] } },
    select: { id: true, name: true, type: true }
  });
  console.log('Categories:', JSON.stringify(cats, null, 2));

  for (const cat of cats) {
    const total = await p.bankTransaction.count({ where: { categoryId: cat.id } });
    console.log(`\n=== ${cat.name} (${cat.id}) ===`);
    console.log(`Total transactions: ${total}`);

    // Show sample transactions
    const samples = await p.bankTransaction.findMany({
      where: { categoryId: cat.id },
      select: {
        id: true, date: true, description: true, amount: true, type: true,
        isReconciled: true, needsReview: true,
        statement: { select: { entityId: true, fileName: true, userId: true } }
      },
      orderBy: { date: 'desc' },
      take: 20
    });
    samples.forEach(tx => {
      const entity = tx.statement?.entityId || 'personal';
      const status = tx.isReconciled ? 'reconciled' : tx.needsReview ? 'needsReview' : 'normal';
      console.log(`  ${new Date(tx.date).toISOString().split('T')[0]} | ${tx.type} | £${tx.amount} | ${status} | entity:${entity} | ${tx.description.substring(0, 60)}`);
    });

    // Check by entity
    const byEntity = await p.$queryRaw`
      SELECT s.entity_id, COUNT(t.id)::int as count 
      FROM bank_transactions t 
      JOIN bank_statements s ON t.statement_id = s.id 
      WHERE t.category_id = ${cat.id}
      GROUP BY s.entity_id
    `;
    console.log('By entity:', JSON.stringify(byEntity));
  }

  // Also check: are there transactions with "pending" in any field?
  const pendingTxs = await p.bankTransaction.findMany({
    where: {
      OR: [
        { description: { contains: 'pending', mode: 'insensitive' } },
        { cleanDescription: { contains: 'pending', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true, date: true, description: true, cleanDescription: true, amount: true, type: true,
      category: { select: { name: true } },
      statement: { select: { entityId: true } }
    },
    take: 20
  });
  console.log('\n=== Transactions with "pending" in description ===');
  console.log(`Found: ${pendingTxs.length}`);
  pendingTxs.forEach(tx => {
    console.log(`  ${new Date(tx.date).toISOString().split('T')[0]} | ${tx.type} | £${tx.amount} | cat:${tx.category?.name || 'none'} | entity:${tx.statement?.entityId || 'personal'} | ${tx.description.substring(0, 80)}`);
  });

  // Check BankTransaction schema for any "status" field
  const sampleTx = await p.bankTransaction.findFirst({
    select: {
      id: true, date: true, description: true, amount: true, type: true,
      isReconciled: true, needsReview: true, notes: true,
      category: { select: { name: true } }
    }
  });
  console.log('\n=== Sample transaction fields ===');
  console.log(JSON.stringify(sampleTx, null, 2));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
