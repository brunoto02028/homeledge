const { IDVClient } = require('yoti');
const fs = require('fs');

const pem = fs.readFileSync('/opt/homeledger/yoti-sandbox.pem', 'utf-8');
const client = new IDVClient('fbd0172b-caf5-4fe5-bab6-4ce60c6731b2', pem);
console.log('IDVClient created OK');
console.log('createSession type:', typeof client.createSession);
console.log('getSession type:', typeof client.getSession);
