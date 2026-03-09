const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Audit: Categorisation Entity Scoping — Verificação Completa no VPS',
      description: [
        'Auditoria completa do sistema de categorização por entidade, verificado no VPS:',
        '',
        '✅ Schema: entityId + unique constraint + 6 indexes',
        '✅ Engine Layer 1: regras filtradas por entityId (tiered: entity > user > system)',
        '✅ Engine Layer 2: feedback scoped por entityId com fallback',
        '✅ Engine Layer 4: auto-learn scoped por entityId',
        '✅ API GET: ?entityId= param com visibilidade tiered',
        '✅ API POST: entityId gravado',
        '✅ Transaction categorize: statement.entityId → recordFeedback',
        '✅ Callers (smart-upload, bills/scan, process-statement): todos passam entityId',
        '✅ UI: entity filter, Building2/Globe badges, create scoped',
        '✅ VPS Health: healthy, DB 1ms, Memory 70%',
      ].join('\n'),
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Fix: 3 Regras Duplicadas Removidas (abacus.ai, tesco, amazon)',
      description: [
        'Encontradas 3 regras duplicadas durante a auditoria:',
        '- abacus.ai (contains) — 2 cópias → mantida a de maior usageCount',
        '- tesco (contains) — 2 cópias → mantida a de maior usageCount',
        '- amazon (contains) — 2 cópias → mantida a de maior usageCount',
        '',
        'Total de regras: 150 → 147 após limpeza.',
        'Verificado: 0 duplicados restantes.',
      ].join('\n'),
      priority: 'medium',
      status: 'completed',
    },
    {
      title: 'Data Backfill: 1069 Feedback Entries com entityId',
      description: [
        'Backfill de entityId em 1069 de 1071 feedback entries:',
        '- Origem: statement → bankTransaction → categorizationFeedback',
        '- 34/34 statements tinham entityId',
        '- 1069/1071 feedback agora com entityId (99.8%)',
        '- 2 entries sem entityId (sem transactionId associado — irrelevante)',
        '',
        'Isto permite que o Layer 2 (Smart Patterns) e Layer 4 (Auto-learn)',
        'funcionem correctamente com feedback entity-scoped.',
      ].join('\n'),
      priority: 'medium',
      status: 'completed',
    },
  ];

  for (const a of actions) {
    const existing = await p.action.findFirst({ where: { userId: admin.id, title: a.title } });
    if (existing) { console.log('  SKIP:', a.title.substring(0, 70)); continue; }
    await p.action.create({
      data: {
        userId: admin.id, actionType: 'other', title: a.title,
        description: a.description, priority: a.priority, status: a.status,
        completedAt: new Date(), dueDate: new Date(), createdBy: 'system',
      },
    });
    console.log('  CREATED:', a.title.substring(0, 70));
  }

  const total = await p.action.count();
  console.log(`\nTotal actions: ${total}`);
}

main().catch(console.error).finally(() => p.$disconnect());
