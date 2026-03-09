const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const hero = await p.landingPageSection.findUnique({ where: { sectionKey: 'hero' } });
  console.log('Current hero content:', JSON.stringify(hero?.content, null, 2));

  if (hero && hero.content) {
    const content = typeof hero.content === 'object' ? { ...hero.content } : {};
    // Remove the old subheadline so the translation takes over
    delete content.subheadline;
    // Also remove headline so the translated version is used
    delete content.headline;

    await p.landingPageSection.update({
      where: { sectionKey: 'hero' },
      data: { content },
    });
    console.log('Updated hero — removed subheadline/headline overrides. Translations will be used.');
  } else {
    console.log('No hero CMS section found.');
  }
}

main().catch(console.error).finally(() => p.$disconnect());
