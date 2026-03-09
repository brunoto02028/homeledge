const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, email: true },
  });

  if (!admin) {
    console.log('No admin user found');
    return;
  }

  console.log('Admin:', admin.email);

  const actions = [
    // Completed this session
    {
      title: 'Smart Rules: Edição inline de regras na tabela',
      description: 'Cada regra tem botão Edit — abre form inline com keyword, match type, categoria, description, transaction type. Save/Cancel. Funciona para system, manual e auto-learned.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Smart Rules: Match types expandidos (Exact, Starts With, Regex)',
      description: 'Além de Contains, agora suporta Exact Match (badge âmbar), Starts With (badge cyan), Regex (badge vermelho). Exact match tem precedência no engine para evitar conflitos (ex: "tesco petrol" exact ≠ "tesco" contains).',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Smart Rules: System rules agora editáveis via API',
      description: 'API PUT /api/categorization-rules/[id] agora permite editar system rules: matchType, keyword, categoryId, description, priority, transactionType, isActive.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'ICO Data Processing Record — Documento Art.30 GDPR criado',
      description: 'docs/ico-data-processing-record.md — Controller details, purposes of processing, lawful basis, data categories, third-party processors, technical measures, DPIA triggers, international transfers, retention schedule, ICO registration checklist.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Cyber Essentials Self-Assessment Checklist criado',
      description: 'docs/cyber-essentials-checklist.md — 5 áreas: Firewalls, Secure Config, User Access Control, Malware Protection, Patching. Application-specific controls. Actions required before certification. Certification body recommendations.',
      priority: 'medium',
      status: 'completed',
    },
    {
      title: 'HMRC MTD Integration Plan — Documentação completa',
      description: 'docs/hmrc-mtd-integration.md — APIs necessárias (ITSA, VAT, CT), developer registration steps, fraud prevention headers, OAuth flow architecture, DB schema (HmrcConnection), software list registration steps, timeline.',
      priority: 'medium',
      status: 'completed',
    },
    {
      title: 'Companies House OAuth Flow — Revisão completa',
      description: 'Revisão do fluxo OAuth CH: connect → callback → token exchange → upsert connection → redirect. Inclui: pre-check de disponibilidade do CH, detecção de serviço down, token refresh, scope encoding fix. Sem alterações necessárias — flow está robusto.',
      priority: 'medium',
      status: 'completed',
    },
  ];

  for (const a of actions) {
    const existing = await prisma.action.findFirst({
      where: { userId: admin.id, title: a.title },
    });

    if (existing) {
      console.log('  SKIP (exists):', a.title);
      continue;
    }

    await prisma.action.create({
      data: {
        userId: admin.id,
        actionType: 'other',
        title: a.title,
        description: a.description,
        priority: a.priority,
        status: a.status,
        completedAt: a.status === 'completed' ? new Date() : null,
        dueDate: new Date(),
        createdBy: 'system',
      },
    });
    console.log('  CREATED:', a.title);
  }

  console.log('\nDone!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
