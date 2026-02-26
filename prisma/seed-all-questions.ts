/**
 * Master seed runner — runs all question seed files in sequence.
 * Run: npx tsx prisma/seed-all-questions.ts
 * 
 * Total questions seeded:
 *   L2: BTRN 32, BKCL 40, ELCO 40 = 112
 *   L3: AVBK 40, FAPR 40, IDRX 40, ETHC 32 = 152
 *   L4: FASL 40, BSTX 40, PSTX 40, MABU 40, MDCL 40 = 200
 *   Grand total: 464 questions (+ 8 existing BTRN = 472)
 */
import { execSync } from 'child_process';
import path from 'path';

const seedFiles = [
  'seed-questions-l2.ts',
  'seed-questions-l2-bkcl.ts',
  'seed-questions-l2-elco.ts',
  'seed-questions-l3-avbk.ts',
  'seed-questions-l3-fapr.ts',
  'seed-questions-l3-idrx.ts',
  'seed-questions-l3-ethc.ts',
  'seed-questions-l4-fasl.ts',
  'seed-questions-l4-bstx.ts',
  'seed-questions-l4-pstx.ts',
  'seed-questions-l4-mabu.ts',
  'seed-questions-l4-mdcl.ts',
];

const prismaDir = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');

console.log('🎓 Academy Question Bank — Master Seeder\n');
console.log(`Running ${seedFiles.length} seed files...\n`);

for (const file of seedFiles) {
  const filePath = path.join(prismaDir, file);
  console.log(`▶ ${file}`);
  try {
    execSync(`npx tsx "${filePath}"`, { stdio: 'inherit', cwd: path.resolve(prismaDir, '..') });
  } catch (err) {
    console.error(`  ❌ Failed: ${file}`);
  }
}

console.log('\n🏁 All seed files processed!');
