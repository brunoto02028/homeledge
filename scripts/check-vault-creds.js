const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.$queryRaw`SELECT key_name, provider, category, CASE WHEN value IS NOT NULL AND value != '' THEN 'HAS_VALUE' ELSE 'EMPTY' END as has_value, is_active FROM api_credentials ORDER BY provider, sort_order`
  .then(r => { console.log(JSON.stringify(r, null, 2)); p.$disconnect(); })
  .catch(e => { console.error(e); p.$disconnect(); });
