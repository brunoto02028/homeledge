const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Professional Services Page — Accounting & Business Management (Public)',
      description: [
        'Página pública /professional-services com todos os serviços profissionais que a Patricia e o Bruno oferecem.',
        'Design dark matching landing page (slate-950, amber/cyan/violet accents, neon cards).',
        '',
        'SECÇÃO 1 — Tax & Accountancy (6 serviços):',
        '  - Bookkeeping, VAT Returns (MTD), Self Assessment, Payroll (RTI),',
        '  - Year-End Accounts (FRS 102/105), Corporation Tax (CT600)',
        '',
        'SECÇÃO 2 — Business Support & Strategy (4 serviços):',
        '  - Business Start-up Advice, Management Accounts,',
        '  - Budgeting & Forecasting, Company Secretarial',
        '',
        'SECÇÃO 3 — Cloud & Compliance (3 serviços):',
        '  - Cloud Accounting Setup (Xero/QuickBooks/FreeAgent),',
        '  - MTD Compliance, Business Compliance (AML/GDPR)',
        '',
        'Why Choose Us (credenciais):',
        '  - Professional Indemnity Insurance, ICO Registered,',
        '  - AML Supervised, Qualified Professionals (bilingual EN/PT)',
        '',
        'Brazilian Audience Banner: "Fala Português? We speak your language!"',
        '  - Destaque para empreendedores brasileiros no UK',
        '',
        'How It Works: 3 steps (Free Consultation → Tailored Plan → Ongoing Support)',
        'Transparency Notice: Não oferece auditing/insolvency/financial advice',
        'Contact CTA: Email + WhatsApp',
        '',
        'Bilingue: Traduções completas EN + PT-BR (120+ chaves)',
        'Landing page: Link adicionado no navbar + footer (Solutions section)',
        'Middleware: /professional-services adicionado como rota pública',
        '',
        'Ficheiros: app/professional-services/page.tsx, app/professional-services/professional-services-client.tsx,',
        '  messages/en.json, messages/pt-BR.json, app/landing-page.tsx, middleware.ts',
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
