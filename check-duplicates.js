const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Find user Patricia
  const user = await p.user.findFirst({
    where: { fullName: { contains: 'Patricia' } },
    select: { id: true, fullName: true },
  });
  if (!user) { console.log('User Patricia not found'); return; }
  console.log('User:', user.fullName, '| ID:', user.id);

  // Find entities by name containing Patricia (userId may differ from user.id)
  const entities = await p.entity.findMany({
    where: { name: { contains: 'Patricia' } },
    select: { id: true, name: true, userId: true },
  });
  console.log('Entities found:', entities.map(e => e.name + ' (userId:' + e.userId + ')').join(', '));

  // Also try all statements directly without entity filter to count total
  const totalStmts = await p.bankStatement.count();
  console.log('Total statements in DB:', totalStmts);

  const stmtWhere = entities.length > 0
    ? { entityId: { in: entities.map(e => e.id) } }
    : {};

  const statements = await p.bankStatement.findMany({
    where: stmtWhere,
    select: { id: true, fileName: true, createdAt: true, parseStatus: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log('\n--- Bank Statements (' + statements.length + ') ---');
  statements.forEach(s => {
    console.log(s.createdAt.toISOString().split('T')[0], '|', s.parseStatus, '|', s.fileName);
  });

  const stmtIds = statements.map(s => s.id);
  if (stmtIds.length === 0) { console.log('No statements found.'); return; }

  // Find duplicate transactions — relation field is statementId
  const txns = await p.bankTransaction.findMany({
    where: { statementId: { in: stmtIds } },
    select: { id: true, date: true, amount: true, description: true, type: true, statementId: true },
    orderBy: [{ date: 'desc' }, { amount: 'asc' }],
  });
  console.log('\nTotal transactions loaded:', txns.length);

  // Group by date+amount+description to find duplicates
  const seen = {};
  const dupes = [];
  for (const t of txns) {
    const day = t.date ? t.date.toISOString().split('T')[0] : 'nodate';
    const key = day + '|' + t.amount + '|' + (t.description || '').trim();
    if (seen[key]) {
      dupes.push({ key, ids: [seen[key].id, t.id], stmts: [seen[key].statementId, t.statementId] });
    } else {
      seen[key] = t;
    }
  }

  if (dupes.length === 0) {
    console.log('\n✅ No duplicate transactions found.');
  } else {
    console.log('\n⚠️  DUPLICATES FOUND (' + dupes.length + '):');
    dupes.slice(0, 30).forEach(d => {
      const sameStmt = d.stmts[0] === d.stmts[1];
      console.log((sameStmt ? '[SAME STMT]' : '[DIFF STMT]'), d.key.substring(0, 60));
    });
    const crossStmt = dupes.filter(d => d.stmts[0] !== d.stmts[1]).length;
    const sameStmt = dupes.filter(d => d.stmts[0] === d.stmts[1]).length;
    console.log('\nSummary: ' + crossStmt + ' cross-statement dupes | ' + sameStmt + ' same-statement dupes');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
