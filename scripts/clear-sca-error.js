const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function main() {
  const conns = await p.bankConnection.findMany({
    select: { id: true, bankName: true, status: true, lastSyncError: true, lastSyncAt: true },
  });
  console.log("Current connections:", JSON.stringify(conns, null, 2));

  // Clear SCA errors on active connections that have a recent sync
  const updated = await p.bankConnection.updateMany({
    where: { status: "active", lastSyncError: { contains: "SCA" } },
    data: { lastSyncError: null },
  });
  console.log("Cleared SCA errors on", updated.count, "connections");

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
