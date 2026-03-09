const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const u = await p.user.findFirst({ where: { role: 'admin' }, select: { id: true } });
  const a = await p.action.create({
    data: {
      userId: u.id,
      actionType: 'other',
      title: 'Smart Rules: Ordenação por coluna (keyword, match, category, source, used, status)',
      description: 'Headers da tabela são clicáveis — ordena asc/desc com ícone de seta. Suporta: Keyword (A-Z), Match Type (Exact>Contains), Category (A-Z), Source (System>Manual>Auto), Used (count), Status (Active/Disabled).',
      priority: 'medium',
      status: 'completed',
      completedAt: new Date(),
      dueDate: new Date(),
      createdBy: 'system',
    },
  });
  console.log('CREATED:', a.title);
}
main().catch(console.error).finally(() => p.$disconnect());
