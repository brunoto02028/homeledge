const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const benefitsCat = await p.category.findFirst({ where: { name: 'Benefits' } });
  if (!benefitsCat) { console.error('Benefits category not found!'); return; }

  // Find uncategorised DWP transactions
  const uncategorised = await p.bankTransaction.findMany({
    where: {
      description: { contains: 'DWP', mode: 'insensitive' },
      categoryId: null
    },
    select: { id: true, date: true, description: true, amount: true }
  });

  console.log('Uncategorised DWP transactions:', uncategorised.length);
  uncategorised.forEach(tx => {
    console.log('  ' + tx.id + ' | ' + new Date(tx.date).toISOString().split('T')[0] + ' | ' + tx.amount + ' | ' + tx.description.substring(0, 60));
  });

  if (uncategorised.length > 0) {
    const result = await p.bankTransaction.updateMany({
      where: { id: { in: uncategorised.map(tx => tx.id) } },
      data: { categoryId: benefitsCat.id, isTaxDeductible: false, needsReview: false }
    });
    console.log('Fixed ' + result.count + ' transactions');
  }

  // Verify final count
  const total = await p.bankTransaction.count({ where: { categoryId: benefitsCat.id } });
  console.log('Total Benefits transactions now: ' + total);

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
