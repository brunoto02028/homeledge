const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       DEEP SYSTEM CHECK — ' + now.toISOString().substring(0, 19) + '       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  // ── 1. BANK CONNECTIONS ──
  console.log('━━━ 1. BANK CONNECTIONS ━━━');
  const conns = await p.$queryRaw`
    SELECT id, bank_name, status, token_expires_at, last_sync_at, last_sync_error,
           entity_id, metadata, created_at,
           CASE WHEN refresh_token IS NOT NULL THEN true ELSE false END as has_refresh,
           CASE WHEN access_token IS NOT NULL THEN true ELSE false END as has_access
    FROM bank_connections WHERE status != 'pending' ORDER BY created_at DESC
  `;
  for (const c of conns) {
    const exp = c.token_expires_at ? new Date(c.token_expires_at) : null;
    const minLeft = exp ? Math.round((exp.getTime() - now.getTime()) / 60000) : -999;
    const lastSync = c.last_sync_at ? Math.round((now.getTime() - new Date(c.last_sync_at).getTime()) / 60000) : -1;
    const created = new Date(c.created_at);
    const ageDays = Math.floor((now.getTime() - created.getTime()) / 86400000);
    const failCount = c.metadata ? (typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata).failedRefreshCount || 0 : 0;

    console.log((minLeft > 0 ? '✅' : '⚠️') + ' ' + (c.bank_name || c.id));
    console.log('   Status:      ' + c.status);
    console.log('   Tokens:      access=' + c.has_access + ', refresh=' + c.has_refresh);
    console.log('   Token exp:   ' + (exp ? exp.toISOString() + ' (' + (minLeft > 0 ? minLeft + ' min left' : 'expired ' + Math.abs(minLeft) + ' min ago') + ')' : 'N/A'));
    console.log('   Last sync:   ' + (lastSync >= 0 ? lastSync + ' min ago' : 'never'));
    console.log('   Age:         ' + ageDays + ' days (consent valid: ' + (90 - ageDays) + ' days left)');
    console.log('   Fail count:  ' + failCount);
    if (c.last_sync_error) console.log('   ERROR:       ' + c.last_sync_error.substring(0, 100));
    console.log('');
  }

  // ── 2. CATEGORISATION / LEARNING SYSTEM ──
  console.log('━━━ 2. CATEGORISATION & LEARNING ━━━');
  const totalTxs = await p.bankTransaction.count();
  const categorised = await p.bankTransaction.count({ where: { categoryId: { not: null } } });
  const approved = await p.bankTransaction.count({ where: { isApproved: true } });
  const needsReview = await p.bankTransaction.count({ where: { needsReview: true } });
  const highConf = await p.bankTransaction.count({ where: { confidenceScore: { gte: 0.85 } } });
  const lowConf = await p.bankTransaction.count({ where: { confidenceScore: { lt: 0.85, gt: 0 } } });
  const noConf = await p.bankTransaction.count({ where: { confidenceScore: null } });

  console.log('   Transactions:     ' + totalTxs);
  console.log('   Categorised:      ' + categorised + ' (' + Math.round(categorised/totalTxs*100) + '%)');
  console.log('   Approved:         ' + approved + ' (' + Math.round(approved/totalTxs*100) + '%)');
  console.log('   Needs Review:     ' + needsReview);
  console.log('   High confidence:  ' + highConf + ' (≥85%)');
  console.log('   Low confidence:   ' + lowConf + ' (<85%)');
  console.log('   No AI score:      ' + noConf + ' (manual/legacy)');

  // Smart Rules
  const rules = await p.$queryRaw`SELECT COUNT(*) as c FROM categorization_rules`;
  const feedback = await p.$queryRaw`SELECT COUNT(*) as c FROM categorization_feedback`;
  console.log('   Smart Rules:      ' + rules[0].c);
  console.log('   AI Feedback:      ' + feedback[0].c);

  // Top uncategorised patterns
  const uncatSample = await p.bankTransaction.findMany({
    where: { categoryId: null },
    select: { description: true, amount: true, type: true },
    take: 10,
    orderBy: { date: 'desc' }
  });
  console.log('\n   Top 10 uncategorised (recent):');
  for (const tx of uncatSample) {
    console.log('   - ' + tx.description.substring(0, 50).padEnd(50) + ' £' + tx.amount + ' (' + tx.type + ')');
  }
  console.log('');

  // ── 3. BENEFITS & BUSINESS INCOME ──
  console.log('━━━ 3. KEY CATEGORIES ━━━');
  const keyCats = ['Benefits', 'Business Income', 'Salary', 'Client Payments'];
  for (const catName of keyCats) {
    const cat = await p.category.findFirst({ where: { name: catName } });
    if (cat) {
      const total = await p.bankTransaction.count({ where: { categoryId: cat.id } });
      const appr = await p.bankTransaction.count({ where: { categoryId: cat.id, isApproved: true } });
      console.log('   ' + catName.padEnd(20) + total + ' total, ' + appr + ' approved');
    }
  }
  console.log('');

  // ── 4. HMRC INTEGRATION ──
  console.log('━━━ 4. HMRC INTEGRATION ━━━');
  // Check tax timeline data
  const entities = await p.entity.findMany({
    select: { id: true, name: true, tradingName: true, type: true, utr: true, companyNumber: true, companyStatus: true }
  });
  for (const e of entities) {
    const hasUTR = !!e.utr;
    const hasCH = !!e.companyNumber;
    console.log('   ' + (e.name || e.tradingName || e.id).substring(0, 30).padEnd(30) + ' | type:' + e.type + ' | UTR:' + (hasUTR ? '✅' : '❌') + ' | CH#:' + (hasCH ? e.companyNumber : '❌'));
  }
  
  // Check HMRC keywords coverage
  const hmrcKwCategories = ['Benefits', 'Salary', 'Business Income', 'Refunds', 'Interest', 'Dividends',
    'Office Costs', 'Travel', 'Utilities', 'Insurance', 'Subscriptions', 'Tax Payments'];
  const existingCats = await p.category.findMany({ where: { name: { in: hmrcKwCategories } }, select: { name: true } });
  const existingNames = existingCats.map(c => c.name);
  const missingCats = hmrcKwCategories.filter(n => !existingNames.includes(n));
  console.log('\n   HMRC categories present:  ' + existingNames.length + '/' + hmrcKwCategories.length);
  if (missingCats.length > 0) console.log('   Missing: ' + missingCats.join(', '));
  else console.log('   All HMRC categories: ✅');
  console.log('');

  // ── 5. COMPANIES HOUSE ──
  console.log('━━━ 5. COMPANIES HOUSE ━━━');
  const companies = await p.entity.findMany({
    where: { companyNumber: { not: null } },
    select: { name: true, companyNumber: true, type: true, companyStatus: true }
  });
  if (companies.length === 0) {
    console.log('   No Companies House linked entities');
  } else {
    for (const c of companies) {
      console.log('   ' + (c.name || '?').padEnd(30) + ' | #' + c.companyNumber + ' | ' + c.type + ' | ' + (c.companyStatus || 'active'));
    }
  }
  // Check CH API env var
  const chKey = process.env.COMPANIES_HOUSE_API_KEY;
  console.log('   CH API Key configured: ' + (chKey ? '✅ (' + chKey.substring(0, 8) + '...)' : '❌ NOT SET'));
  console.log('');

  // ── 6. CRON HEALTH ──
  console.log('━━━ 6. CRON & SYSTEM HEALTH ━━━');
  console.log('   PM2 process: homeledger');
  console.log('   Crons configured:');
  console.log('   - refresh-tokens:  every hour at :30');
  console.log('   - sync-banks:      3x/day (06:00, 14:00, 22:00 UTC)');
  console.log('   - daily-checks:    daily at 08:00 UTC');
  console.log('   - backup-db:       daily at 03:00 UTC');
  
  // Last sync times
  const recentSyncs = conns.filter(c => c.last_sync_at).map(c => ({
    bank: c.bank_name,
    ago: Math.round((now.getTime() - new Date(c.last_sync_at).getTime()) / 60000)
  }));
  console.log('\n   Last syncs:');
  for (const s of recentSyncs) {
    const ok = s.ago < 720; // 12h
    console.log('   ' + (ok ? '✅' : '⚠️') + ' ' + s.bank + ': ' + s.ago + ' min ago');
  }
  console.log('');

  // ── FINAL VERDICT ──
  const issues = [];
  const expiredTokens = conns.filter(c => {
    const exp = c.token_expires_at ? new Date(c.token_expires_at).getTime() : 0;
    return exp < now.getTime() && !c.has_refresh;
  });
  if (expiredTokens.length > 0) issues.push(expiredTokens.length + ' connections with expired tokens and no refresh');
  if (missingCats.length > 0) issues.push('Missing HMRC categories: ' + missingCats.join(', '));
  if (!chKey) issues.push('Companies House API key not configured');

  console.log('╔══════════════════════════════════════════════════╗');
  if (issues.length === 0) {
    console.log('║  ✅ ALL SYSTEMS OPERATIONAL                      ║');
  } else {
    console.log('║  ⚠️  ' + issues.length + ' ISSUE(S) FOUND                          ║');
    for (const i of issues) {
      console.log('║  - ' + i.substring(0, 46).padEnd(46) + '║');
    }
  }
  console.log('╚══════════════════════════════════════════════════╝');

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
