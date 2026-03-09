const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, email: true },
  });

  if (!admin) {
    console.log('No admin user found');
    return;
  }

  console.log('Admin:', admin.email);

  const today = new Date().toISOString().split('T')[0];

  const actions = [
    {
      title: 'Homologação: Database Backups (H6)',
      description: 'backup-db.sh + restore-db.sh criados. Cron daily 3am UTC. Testado: 134 tabelas, 668K. Retenção 30 dias daily, 12 semanas weekly.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: SSL/TLS Enforcement (H10)',
      description: 'HTTPS redirect implementado no middleware.ts para produção. HSTS header adicionado no next.config.js com max-age 2 anos.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: Security Headers & Rate Limiting (H2)',
      description: 'Rate limiting em signup (5/min), forgot-password (5/min), send-login-code (10/min). CSP header com fontes permitidas. X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: Health Check Endpoint (H5)',
      description: '/api/health — público, sem auth. Verifica DB (latência), memória (heap/RSS), uptime. Retorna status healthy/degraded/unhealthy.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: GDPR Compliance (H1)',
      description: 'Data export GDPR-completo (Art.20) com todas as categorias de dados. API de deleção de conta (Art.17) com confirmação dupla (password + texto). UI integrada no Settings.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: Legal Pages (H3)',
      description: 'Páginas /terms, /privacy, /cookies já existiam e estão completas com conteúdo UK-compliant.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: Audit Trail (H7)',
      description: 'lib/audit-log.ts criado — logger centralizado para operações sensíveis. Integrado em: deleção de conta, upload de statements. Tipos: auth, financial, entity, vault, admin, banking.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: E2E Tests — API Health & Security (H4)',
      description: 'e2e/api-health.test.ts — 30+ testes: health endpoint, security headers (HSTS, CSP, X-Frame), rotas públicas/privadas, proteção de API, rate limiting.',
      priority: 'high',
      status: 'completed',
    },
    {
      title: 'Homologação: Accessibility WCAG 2.1 AA (H8)',
      description: 'Skip-to-content link para keyboard users. <main> landmark com role=main no layout.tsx. Font display swap.',
      priority: 'medium',
      status: 'completed',
    },
    {
      title: 'Homologação: Performance — Memory Cache (H9)',
      description: 'lib/cache.ts — in-memory TTL cache com invalidação por prefix. Singleton global. Auto-cleanup a cada 10 min. Max 500 entries.',
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
        dueDate: new Date(today),
        createdBy: 'system',
      },
    });
    console.log('  CREATED:', a.title);
  }

  console.log('\nDone! All homologation actions registered.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
