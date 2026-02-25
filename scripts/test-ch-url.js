// Test what URL our buildCHAuthUrl generates
const CH_IDENTITY_BASE = 'https://identity.company-information.service.gov.uk';

function buildScopes(companyNumber) {
  return [
    `https://api.companieshouse.gov.uk/company/${companyNumber}/registered-office-address.update`,
    `https://api.companieshouse.gov.uk/company/${companyNumber}/officers`,
    `https://api.companieshouse.gov.uk/company/${companyNumber}/confirmation-statement`,
    `https://identity.company-information.service.gov.uk/user/profile.read`,
  ].join(' ');
}

const clientId = process.env.CH_OAUTH_CLIENT_ID || 'NOT_SET';
const redirectUri = (process.env.NEXTAUTH_URL || 'https://homeledger.co.uk') + '/api/government/callback/companies-house';
const scope = buildScopes('16548405');

const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  redirect_uri: redirectUri,
  scope: scope,
  state: 'test_state_123',
});

const url = `${CH_IDENTITY_BASE}/oauth2/authorise?${params.toString()}`;
console.log('=== Generated URL ===');
console.log(url);
console.log('\n=== Scope encoding ===');
console.log('Raw scope:', scope);
console.log('URLSearchParams encodes spaces as +:', params.get('scope').includes('+'));
console.log('\n=== With %20 instead of + ===');
const fixedUrl = url.replace(/scope=([^&]+)/, (match, val) => 'scope=' + val.replace(/\+/g, '%20'));
console.log(fixedUrl);
