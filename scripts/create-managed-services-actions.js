const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Landing Page — Managed Services Section + Updated Hero (Platform + Professional Support)',
      description: [
        'Updated the landing page (clarityco.co.uk) to clearly communicate the dual value proposition:',
        'Clarity & Co is both a PLATFORM and a PROFESSIONAL SERVICE.',
        '',
        'HERO UPDATES:',
        '  - Badge: "AI-Powered Platform + Professional Accounting Services"',
        '  - Subtitle: Mentions managed services, bookkeeping, tax returns, VAT, payroll',
        '  - Targets UK sole traders, small businesses, and Brazilian entrepreneurs',
        '  - CMS database updated to remove old static overrides',
        '',
        'NEW SECTION — "Your Finances, Managed by Experts Who Care":',
        '  Two-column layout:',
        '  LEFT — The Platform (Your Financial Hub):',
        '    Bank statements/invoices/bills, AI receipt scanning, HMRC reports,',
        '    Document OCR & vault, AI categorisation, Tax timeline & reminders',
        '  RIGHT — Our Team (Your Financial Partners):',
        '    SA & Corporation Tax filed for you, Monthly bookkeeping & VAT (MTD),',
        '    Payroll/RTI, Company secretarial, AML/ICO/PI credentials,',
        '    Bilingual EN/PT support',
        '',
        '  4-step "How It Works" mini:',
        '    01. Sign up → 02. Dedicated professional assigned →',
        '    03. Real-time dashboard → 04. Returns filed, compliant, growing',
        '',
        '  CTAs: "Explore Our Services" → /professional-services, "Start Your Free Trial" → /register',
        '',
        'Fully bilingual EN + PT-BR (30+ new translation keys)',
        'Audited with Puppeteer — all sections rendering correctly in both languages',
        '',
        'Files: app/landing-page.tsx, messages/en.json, messages/pt-BR.json,',
        '  scripts/update-hero-cms.js (CMS database fix)',
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
