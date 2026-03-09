const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'Self Assessment Registration Guide — Processo Completo UTR/HMRC',
      description: [
        'Página educativa completa que guia self-employed users pelo processo de registo no HMRC e obtenção do UTR.',
        '',
        'STEP 1 — "Understand Self Assessment":',
        '  - O que é Self Assessment e quem precisa',
        '  - Lista de situações que requerem registo',
        '  - Explicação clara do UTR (10 dígitos, formato)',
        '  - Deadlines importantes: 5 Oct, 31 Oct, 31 Jan, 31 Jul',
        '',
        'STEP 2 — "Gather Your Information":',
        '  - Checklist de documentos necessários (nome, DOB, NI, endereço, etc.)',
        '  - Links para encontrar NI number no GOV.UK',
        '  - 8 itens com ícones e descrições detalhadas',
        '',
        'STEP 3 — "Register with HMRC":',
        '  - 5 passos numerados com links directos ao GOV.UK',
        '  - Criar Government Gateway, registar SA, verificar identidade, esperar UTR, activar conta',
        '  - Alternativa: registar por telefone (0300 200 3310)',
        '  - Aviso de penalidades por registo tardio',
        '',
        'STEP 4 — "Get Your UTR Number":',
        '  - O que fazer quando receber a carta',
        '  - O que fazer se não receber (contactos HMRC)',
        '  - Input directo para salvar UTR + NI number',
        '  - Salva automaticamente na Entity e TaxpayerProfile',
        '',
        'STEP 5 — "Set Up in Clarity & Co":',
        '  - 6 next-steps com links: Upload Statements, Scan Receipts, Tax Reports, HMRC Connect, Tax Timeline, Budget Categories',
        '  - Tax Allowances 2024/25: Personal Allowance, Trading Allowance, tax rates',
        '',
        'Features:',
        '  - Barra de progresso com tracking persistente (localStorage)',
        '  - Auto-detecção de UTR existente na Entity/TaxpayerProfile',
        '  - Quick Reference Links (6 links directos ao GOV.UK)',
        '  - Selector de Entity (se múltiplas)',
        '  - Nav item adicionado: "SA Registration Guide"',
        '  - Traduções EN + PT-BR',
        '  - Permissões via reports permission',
        '',
        'Ficheiros: app/self-assessment-guide/page.tsx, app/self-assessment-guide/self-assessment-guide-client.tsx,',
        '  components/navigation.tsx, messages/en.json, messages/pt-BR.json, lib/permissions.ts, middleware.ts',
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
