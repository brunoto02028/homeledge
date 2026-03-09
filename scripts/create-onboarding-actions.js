const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Onboarding Wizard: 3-Step Visual Setup para Novos Utilizadores',
      description: [
        'Implementação completa do Onboarding Wizard — 3 passos visuais e didáticos:',
        '',
        'STEP 1 — "About You":',
        '  - Nome do utilizador',
        '  - Tipo de perfil: Individual/Family, Self-Employed, Ltd Company, CIC/Charity',
        '  - Cards visuais com emojis, gradients, descrições simples (teenager-friendly)',
        '  - Nome do negócio (condicional se business)',
        '',
        'STEP 2 — "Your Tools":',
        '  - 8 ferramentas seleccionáveis: Receipts, Statements, Reports, Invoices, Budget, Banking, Vault, Compliance',
        '  - Cards com emojis, ícones coloridos, descrições em linguagem simples',
        '  - Contador de tools seleccionadas',
        '',
        'STEP 3 — "Ready!":',
        '  - Resumo visual do perfil e ferramentas escolhidas',
        '  - "Explore Later" card com features não seleccionadas',
        '  - Nota de segurança (dados encriptados)',
        '  - Botão "Let\'s Go!" com gradient',
        '',
        'Backend:',
        '  - OnboardingProfile model (Prisma) — entityType, selectedFeatures, experienceLevel',
        '  - API /api/onboarding — GET (com profile) + PUT (salva profile + cria Entity)',
        '  - Auto-criação de Entity baseada no entityType seleccionado',
        '  - Middleware redirect já existente (lines 94-100)',
        '',
        'Ficheiros: prisma/schema.prisma, app/api/onboarding/route.ts, app/onboarding/onboarding-client.tsx',
      ].join('\n'),
      priority: 'high',
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
