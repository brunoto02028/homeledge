const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admin = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true, email: true } });
  console.log('Admin:', admin.email);

  const actions = [
    {
      title: 'IDV Stripe Integration Setup — Configurado no VPS',
      description: 'Stripe keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, 4 price IDs) copiadas de .env para .env.production. PM2 reload --update-env. Checkout, webhook, portal, verify-session, verify-checkout tudo funcional.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'IDV Implementação: Multi-Provider Architecture',
      description: 'lib/idv-provider.ts — Interface abstrata IIdvProvider com adapters para Yoti (activo), Sumsub (pronto para integrar), Onfido (pronto para integrar). getIdvProvider() auto-detecta provider configurado. listProviders() mostra status de cada.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'IDV Serviço Público: Página de Venda (verify-purchase) — Já existia',
      description: 'Página pública /verify-purchase com 3 planos (Single £2.99, Business £19.99, Enterprise £49.99), Stripe checkout, formulário de detalhes, success page com links de verificação. 391 linhas.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'IDV Serviço Público: Dashboard Temporário para Compradores',
      description: 'Nova página pública /verify-dashboard — buyer insere email de compra, vê stats (total/verified/pending/expired) e lista de links com status, datas, copiar link, abrir link. API /api/verify-dashboard (público). Middleware actualizado.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'IDV Caso de Uso 3: Auto-Verificação Individual — Já existia',
      description: 'Página /verify-identity com Yoti integration: mock mode + real mode, QR code para desktop, iframe para mobile, auto-polling 5s, document check + selfie match + liveness check. 406 linhas.',
      priority: 'medium',
      status: 'completed',
    },
    {
      title: 'Smart Rules: Ordenação por coluna na tabela de regras',
      description: 'Headers clicáveis com toggle asc/desc: Keyword (A-Z), Match Type (Exact>Contains), Category (A-Z), Source (System>Manual>Auto), Used (count), Status (Active/Disabled). Ícones ArrowUp/ArrowDown roxos.',
      priority: 'medium',
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

  // Also mark existing pending actions as completed where applicable
  const toComplete = [
    'IDV Servico Publico: Stripe Integration Setup',
    'IDV Implementacao: Multi-Provider Architecture',
    'IDV Servico Publico: Pagina de Venda no Site (sem login)',
    'IDV Servico Publico: Dashboard Temporario para Compradores',
    'IDV Caso de Uso 3: Auto-Verificacao Individual',
  ];

  for (const title of toComplete) {
    const action = await p.action.findFirst({
      where: { title: { contains: title.substring(0, 30) }, status: { not: 'completed' } },
    });
    if (action) {
      await p.action.update({
        where: { id: action.id },
        data: { status: 'completed', completedAt: new Date() },
      });
      console.log('  MARKED COMPLETED:', action.title.substring(0, 60));
    }
  }

  console.log('\nDone!');
}

main().catch(console.error).finally(() => p.$disconnect());
