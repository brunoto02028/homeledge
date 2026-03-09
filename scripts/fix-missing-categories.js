const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const missing = [
    { name: 'Office Costs', type: 'expense', hmrcMapping: 'office_costs', taxRegime: 'hmrc',
      description: 'Stationery, printing, postage, phone, software' },
    { name: 'Tax Payments', type: 'expense', hmrcMapping: 'none', taxRegime: 'universal',
      description: 'HMRC payments, self-assessment, VAT, NI' },
  ];

  for (const cat of missing) {
    const exists = await p.category.findFirst({ where: { name: cat.name } });
    if (exists) {
      console.log('✅ ' + cat.name + ' already exists (id: ' + exists.id + ')');
    } else {
      const created = await p.category.create({ data: cat });
      console.log('✅ Created ' + cat.name + ' (id: ' + created.id + ')');
    }
  }

  // Verify all HMRC categories exist
  const hmrcCats = ['Benefits', 'Salary', 'Business Income', 'Refunds', 'Interest', 'Dividends',
    'Office Costs', 'Travel', 'Utilities', 'Insurance', 'Subscriptions', 'Tax Payments'];
  const found = await p.category.findMany({ where: { name: { in: hmrcCats } }, select: { name: true } });
  const foundNames = found.map(c => c.name);
  const still = hmrcCats.filter(n => !foundNames.includes(n));
  console.log('\nHMRC categories: ' + foundNames.length + '/' + hmrcCats.length);
  if (still.length > 0) console.log('Still missing: ' + still.join(', '));
  else console.log('All HMRC categories present ✅');

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
