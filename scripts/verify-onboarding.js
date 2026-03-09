const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check table exists
  const tables = await p.$queryRaw`SELECT tablename FROM pg_tables WHERE tablename='onboarding_profiles'`;
  console.log('onboarding_profiles table exists:', tables.length > 0);

  // Check columns
  if (tables.length > 0) {
    const cols = await p.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='onboarding_profiles' ORDER BY ordinal_position`;
    console.log('Columns:', cols.map(c => c.column_name).join(', '));
  }

  // Count existing profiles
  const count = await p.onboardingProfile.count();
  console.log('Existing profiles:', count);

  console.log('\nDone!');
}

main().catch(console.error).finally(() => p.$disconnect());
