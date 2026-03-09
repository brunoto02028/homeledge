require('dotenv').config({ path: '.env.production' });
require('dotenv').config({ path: '.env' });

console.log('CLIENT_ID:', process.env.TRUELAYER_CLIENT_ID ? 'SET' : 'MISSING');
console.log('SECRET:', process.env.TRUELAYER_CLIENT_SECRET ? 'SET' : 'MISSING');
console.log('REDIRECT:', process.env.TRUELAYER_REDIRECT_URI || 'MISSING');
console.log('SANDBOX:', process.env.TRUELAYER_SANDBOX || 'MISSING');
