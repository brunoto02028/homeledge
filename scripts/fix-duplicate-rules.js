const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  console.log('=== FIX DUPLICATE RULES ===\n');

  // Find duplicates
  const dupes = await p.$queryRaw`
    SELECT keyword, match_type, user_id, entity_id, COUNT(*) as cnt,
           array_agg(id ORDER BY usage_count DESC) as ids
    FROM categorization_rules
    GROUP BY keyword, match_type, user_id, entity_id
    HAVING COUNT(*) > 1`;

  console.log(`Found ${dupes.length} duplicate groups`);

  for (const d of dupes) {
    const ids = d.ids;
    const keepId = ids[0]; // keep the one with highest usage_count
    const deleteIds = ids.slice(1);
    console.log(`\n"${d.keyword}" (${d.match_type}): keeping ${keepId.substring(0,8)}..., deleting ${deleteIds.length} duplicates`);

    for (const delId of deleteIds) {
      await p.categorizationRule.delete({ where: { id: delId } });
      console.log(`  Deleted: ${delId.substring(0,8)}...`);
    }
  }

  // Also backfill feedback entityId from statement where possible
  console.log('\n=== BACKFILL FEEDBACK entityId ===');
  const feedbackWithTx = await p.$queryRaw`
    SELECT cf.id, bt.id as tx_id, bs.entity_id
    FROM categorization_feedback cf
    JOIN bank_transactions bt ON bt.id = cf.transaction_id
    JOIN bank_statements bs ON bs.id = bt.statement_id
    WHERE cf.entity_id IS NULL AND bs.entity_id IS NOT NULL
    LIMIT 2000`;

  console.log(`Found ${feedbackWithTx.length} feedback entries to backfill`);

  if (feedbackWithTx.length > 0) {
    let updated = 0;
    for (const fb of feedbackWithTx) {
      await p.categorizationFeedback.update({
        where: { id: fb.id },
        data: { entityId: fb.entity_id },
      });
      updated++;
    }
    console.log(`Backfilled ${updated} feedback entries with entityId`);
  }

  // Verify
  const remaining = await p.$queryRaw`
    SELECT keyword, match_type, COUNT(*) as cnt
    FROM categorization_rules
    GROUP BY keyword, match_type, user_id, entity_id
    HAVING COUNT(*) > 1`;
  console.log(`\nRemaining duplicates: ${remaining.length}`);

  const fbStillNull = await p.categorizationFeedback.count({ where: { entityId: null } });
  const fbTotal = await p.categorizationFeedback.count();
  console.log(`Feedback without entityId: ${fbStillNull}/${fbTotal}`);

  console.log('\n=== DONE ===');
}

main().catch(console.error).finally(() => p.$disconnect());
