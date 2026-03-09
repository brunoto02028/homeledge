const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find the Benefits category
  const benefitsCat = await p.category.findFirst({ where: { name: 'Benefits' } });
  if (!benefitsCat) { console.error('Benefits category not found!'); return; }
  console.log('Benefits category ID:', benefitsCat.id);

  // Find all DWP UC transactions that are NOT categorized as Benefits
  const dwpTxs = await p.bankTransaction.findMany({
    where: {
      OR: [
        { description: { contains: 'DWP', mode: 'insensitive' } },
        { description: { contains: 'universal credit', mode: 'insensitive' } },
        { description: { contains: 'child benefit', mode: 'insensitive' } },
        { description: { contains: 'tax credit', mode: 'insensitive' } },
      ],
      NOT: { categoryId: benefitsCat.id }
    },
    select: { id: true, date: true, description: true, amount: true, categoryId: true }
  });

  console.log(`Found ${dwpTxs.length} DWP/UC transactions NOT in Benefits category:`);
  dwpTxs.forEach(tx => {
    console.log(`  ${tx.id} | ${new Date(tx.date).toISOString().split('T')[0]} | £${tx.amount} | ${tx.description.substring(0, 60)}`);
  });

  if (dwpTxs.length === 0) {
    console.log('Nothing to fix!');
    await p.$disconnect();
    return;
  }

  // Update them all to Benefits category
  const result = await p.bankTransaction.updateMany({
    where: { id: { in: dwpTxs.map(tx => tx.id) } },
    data: { categoryId: benefitsCat.id, isTaxDeductible: false, needsReview: false }
  });

  console.log(`Updated ${result.count} transactions to Benefits category`);
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
