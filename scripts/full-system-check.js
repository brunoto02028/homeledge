const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          FULL SYSTEM VERIFICATION               ║');
  console.log('║          ' + new Date().toISOString() + '          ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 1. BANK CONNECTIONS ──
  console.log('━━━ 1. BANK CONNECTIONS ━━━');
  const conns = await p.$queryRaw`
    SELECT id, bank_name, status, token_expires_at, last_sync_at, last_sync_error,
           entity_id, metadata,
           CASE WHEN refresh_token IS NOT NULL THEN true ELSE false END as has_refresh,
           CASE WHEN access_token IS NOT NULL THEN true ELSE false END as has_access
    FROM bank_connections
    WHERE status != 'pending'
    ORDER BY created_at DESC
  `;
  const now = Date.now();
  let bankIssues = 0;
  for (const c of conns) {
    const exp = c.token_expires_at ? new Date(c.token_expires_at).getTime() : 0;
    const minLeft = exp ? Math.round((exp - now) / 60000) : -1;
    const tokenOk = minLeft > 0;
    const noError = !c.last_sync_error;
    const ok = c.status === 'active' && tokenOk && noError;
    const icon = ok ? '✅' : '⚠️';
    if (!ok) bankIssues++;
    console.log(icon + ' ' + (c.bank_name || c.id));
    console.log('   Status: ' + c.status + ' | Token: ' + (tokenOk ? minLeft + ' min left' : 'EXPIRED') + ' | Error: ' + (c.last_sync_error || 'none'));
  }
  console.log('Result: ' + conns.length + ' connections, ' + bankIssues + ' with issues\n');

  // ── 2. BENEFITS TRANSACTIONS ──
  console.log('━━━ 2. BENEFITS TRANSACTIONS ━━━');
  const benCat = await p.category.findFirst({ where: { name: 'Benefits' } });
  const benTotal = benCat ? await p.bankTransaction.count({ where: { categoryId: benCat.id } }) : 0;
  const benApproved = benCat ? await p.bankTransaction.count({ where: { categoryId: benCat.id, isApproved: true } }) : 0;
  
  // Check for DWP UC transactions NOT in Benefits
  const missingDwp = await p.bankTransaction.count({
    where: {
      OR: [
        { description: { contains: 'DWP', mode: 'insensitive' } },
        { description: { contains: 'universal credit', mode: 'insensitive' } },
      ],
      NOT: { categoryId: benCat?.id || 'none' }
    }
  });
  const benOk = benTotal >= 19 && missingDwp === 0;
  console.log((benOk ? '✅' : '⚠️') + ' Benefits: ' + benTotal + ' total, ' + benApproved + ' approved');
  console.log('   DWP/UC not in Benefits: ' + missingDwp);

  // Benefits by tax year
  const benTxs = benCat ? await p.bankTransaction.findMany({
    where: { categoryId: benCat.id },
    select: { date: true },
    orderBy: { date: 'asc' }
  }) : [];
  const byYear = {};
  for (const tx of benTxs) {
    const d = new Date(tx.date);
    const yr = d.getMonth() < 3 || (d.getMonth() === 3 && d.getDate() <= 5)
      ? (d.getFullYear() - 1) + '/' + (d.getFullYear() % 100)
      : d.getFullYear() + '/' + ((d.getFullYear() + 1) % 100);
    byYear[yr] = (byYear[yr] || 0) + 1;
  }
  console.log('   By tax year: ' + JSON.stringify(byYear) + '\n');

  // ── 3. BUSINESS INCOME ──
  console.log('━━━ 3. BUSINESS INCOME ━━━');
  const biCat = await p.category.findFirst({ where: { name: 'Business Income' } });
  const biTotal = biCat ? await p.bankTransaction.count({ where: { categoryId: biCat.id } }) : 0;
  const biApproved = biCat ? await p.bankTransaction.count({ where: { categoryId: biCat.id, isApproved: true } }) : 0;
  const biPending = biTotal - biApproved;
  const biOk = biApproved === biTotal;
  console.log((biOk ? '✅' : '⚠️') + ' Business Income: ' + biTotal + ' total, ' + biApproved + ' approved, ' + biPending + ' pending\n');

  // ── 4. OVERALL TRANSACTION HEALTH ──
  console.log('━━━ 4. OVERALL TRANSACTION HEALTH ━━━');
  const totalTxs = await p.bankTransaction.count();
  const approvedTxs = await p.bankTransaction.count({ where: { isApproved: true } });
  const categorisedTxs = await p.bankTransaction.count({ where: { categoryId: { not: null } } });
  const uncategorisedTxs = totalTxs - categorisedTxs;
  const needsReviewTxs = await p.bankTransaction.count({ where: { needsReview: true } });
  console.log('   Total:        ' + totalTxs);
  console.log('   Categorised:  ' + categorisedTxs + ' (' + Math.round(categorisedTxs / totalTxs * 100) + '%)');
  console.log('   Uncategorised: ' + uncategorisedTxs);
  console.log('   Approved:     ' + approvedTxs + ' (' + Math.round(approvedTxs / totalTxs * 100) + '%)');
  console.log('   Needs Review: ' + needsReviewTxs + '\n');

  // ── 5. ENTITIES & STATEMENTS ──
  console.log('━━━ 5. ENTITIES & STATEMENTS ━━━');
  const entities = await p.entity.count();
  const statements = await p.bankStatement.count();
  const invoices = await p.invoice.count();
  const bills = await p.bill.count();
  console.log('   Entities:   ' + entities);
  console.log('   Statements: ' + statements);
  console.log('   Invoices:   ' + invoices);
  console.log('   Bills:      ' + bills + '\n');

  // ── 6. USERS ──
  console.log('━━━ 6. USERS ━━━');
  const users = await p.user.findMany({ select: { id: true, fullName: true, email: true, role: true, plan: true, status: true } });
  for (const u of users) {
    console.log('   ' + (u.fullName || u.email) + ' | ' + u.role + ' | plan:' + (u.plan || 'none') + ' | ' + u.status);
  }
  console.log('');

  // ── 7. CRON JOBS VERIFICATION ──
  console.log('━━━ 7. CRON SCHEDULE ━━━');
  const lastSyncs = await p.$queryRaw`
    SELECT bank_name, last_sync_at FROM bank_connections WHERE status = 'active' ORDER BY last_sync_at DESC LIMIT 3
  `;
  for (const s of lastSyncs) {
    const ago = Math.round((now - new Date(s.last_sync_at).getTime()) / 60000);
    console.log('   ' + s.bank_name + ' last sync: ' + ago + ' min ago');
  }
  console.log('');

  // ── FINAL VERDICT ──
  const issues = [];
  if (bankIssues > 0) issues.push(bankIssues + ' bank connection issues');
  if (!benOk) issues.push('Benefits categorisation incomplete');
  if (!biOk) issues.push(biPending + ' Business Income pending');
  if (uncategorisedTxs > 50) issues.push(uncategorisedTxs + ' uncategorised transactions');

  console.log('╔══════════════════════════════════════════════════╗');
  if (issues.length === 0) {
    console.log('║  ✅ ALL CHECKS PASSED — SYSTEM HEALTHY           ║');
  } else {
    console.log('║  ⚠️  ' + issues.length + ' ISSUE(S) FOUND                          ║');
    for (const i of issues) {
      console.log('║  - ' + i.padEnd(46) + '║');
    }
  }
  console.log('╚══════════════════════════════════════════════════╝');

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
