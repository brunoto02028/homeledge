const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find ALL DWP UC transactions regardless of category
  const dwpTxs = await p.bankTransaction.findMany({
    where: {
      OR: [
        { description: { contains: 'DWP', mode: 'insensitive' } },
        { description: { contains: 'universal credit', mode: 'insensitive' } },
        { description: { contains: 'child benefit', mode: 'insensitive' } },
        { description: { contains: 'tax credit', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true, date: true, description: true, amount: true, type: true,
      categoryId: true,
      category: { select: { id: true, name: true } },
      statement: { select: { entityId: true, fileName: true } }
    },
    orderBy: { date: 'desc' }
  });

  console.log(`=== ALL DWP/UC/Benefits-related transactions: ${dwpTxs.length} ===`);
  dwpTxs.forEach(tx => {
    const catName = tx.category?.name || '** UNCATEGORISED **';
    const entity = tx.statement?.entityId || 'personal';
    console.log(`  ${new Date(tx.date).toISOString().split('T')[0]} | £${tx.amount} | cat: ${catName} | entity: ${entity} | ${tx.description.substring(0, 80)}`);
  });

  // Count uncategorised
  const uncategorised = dwpTxs.filter(tx => !tx.categoryId);
  const wrongCat = dwpTxs.filter(tx => tx.category && tx.category.name !== 'Benefits');
  console.log(`\nUncategorised DWP txs: ${uncategorised.length}`);
  console.log(`Wrongly categorised DWP txs: ${wrongCat.length}`);
  wrongCat.forEach(tx => {
    console.log(`  ${new Date(tx.date).toISOString().split('T')[0]} | £${tx.amount} | cat: ${tx.category?.name} | ${tx.description.substring(0, 60)}`);
  });

  // Check Business Income transactions that are NOT approved
  const biCat = await p.category.findFirst({ where: { name: 'Business Income' } });
  if (biCat) {
    const biTotal = await p.bankTransaction.count({ where: { categoryId: biCat.id } });
    const biApproved = await p.bankTransaction.count({ where: { categoryId: biCat.id, isApproved: true } });
    const biNotApproved = await p.bankTransaction.count({ where: { categoryId: biCat.id, isApproved: false } });
    console.log(`\n=== Business Income approval status ===`);
    console.log(`Total: ${biTotal}, Approved: ${biApproved}, Not Approved (Pending): ${biNotApproved}`);
  }

  // Check Benefits approval status too
  const benCat = await p.category.findFirst({ where: { name: 'Benefits' } });
  if (benCat) {
    const benTotal = await p.bankTransaction.count({ where: { categoryId: benCat.id } });
    const benApproved = await p.bankTransaction.count({ where: { categoryId: benCat.id, isApproved: true } });
    console.log(`\n=== Benefits approval status ===`);
    console.log(`Total: ${benTotal}, Approved: ${benApproved}, Not Approved (Pending): ${benTotal - benApproved}`);
  }

  // Check how many total transactions are approved vs not
  const totalTx = await p.bankTransaction.count();
  const totalApproved = await p.bankTransaction.count({ where: { isApproved: true } });
  console.log(`\n=== Overall approval status ===`);
  console.log(`Total: ${totalTx}, Approved: ${totalApproved} (${((totalApproved/totalTx)*100).toFixed(1)}%), Pending: ${totalTx - totalApproved}`);

  // Check Benefits by tax year
  // UK tax year 2024/25: 6 Apr 2024 - 5 Apr 2025
  // UK tax year 2025/26: 6 Apr 2025 - 5 Apr 2026
  if (benCat) {
    const ty2425 = await p.bankTransaction.count({
      where: {
        categoryId: benCat.id,
        date: { gte: new Date('2024-04-06'), lte: new Date('2025-04-05') }
      }
    });
    const ty2526 = await p.bankTransaction.count({
      where: {
        categoryId: benCat.id,
        date: { gte: new Date('2025-04-06'), lte: new Date('2026-04-05') }
      }
    });
    console.log(`\n=== Benefits by tax year ===`);
    console.log(`2024/25: ${ty2425} transactions`);
    console.log(`2025/26: ${ty2526} transactions`);
  }

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
