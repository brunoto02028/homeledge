const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Audit & Fix: Categorisation Engine — Entity Scoping (6 bugs críticos)',
      description: [
        'AUDITORIA COMPLETA do sistema de categorização. 6 bugs críticos corrigidos:',
        '1. Layer 1 (Rules): Regras de todas as entidades misturadas — agora filtradas por entityId com prioridade tiered (entity > user > system)',
        '2. Layer 2 (Patterns): Feedback de todas entidades misturado — agora scoped por entityId com fallback',
        '3. Layer 4 (Auto-learn): Contagem de correcções cruzava entidades — agora scoped por entityId',
        '4. Layer 4 (Auto-learn): Verificação de regra existente ignorava entityId — corrigido',
        '5. API GET: Sem filtro de entidade — adicionado ?entityId= com visibilidade tiered',
        '6. Transaction categorize: entityId não passado ao recordFeedback — corrigido via statement.entityId',
        '',
        'UI melhorada: Entity filter dropdown, Entity scope badges (Building2/Globe), Create form scoped, Legend actualizada.',
        'Report completo: docs/audit-categorization-entity-scoping.md',
        '',
        'Ficheiros: lib/categorization-engine.ts, app/api/categorization-rules/route.ts, app/api/statements/transactions/[id]/categorize/route.ts, app/categorization-rules/page.tsx',
      ].join('\n'),
      priority: 'high',
      status: 'completed',
    },
  ];

  for (const a of actions) {
    const existing = await p.action.findFirst({ where: { userId: admin.id, title: a.title } });
    if (existing) { console.log('  SKIP:', a.title.substring(0, 60)); continue; }
    await p.action.create({
      data: {
        userId: admin.id, actionType: 'other', title: a.title,
        description: a.description, priority: a.priority, status: a.status,
        completedAt: new Date(), dueDate: new Date(), createdBy: 'system',
      },
    });
    console.log('  CREATED:', a.title.substring(0, 60));
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => p.$disconnect());
