// Test creating an actual Yoti IDV session from the server
process.env.YOTI_CLIENT_SDK_ID = process.env.YOTI_CLIENT_SDK_ID || 'fbd0172b-caf5-4fe5-bab6-4ce60c6731b2';
process.env.YOTI_PEM_KEY_PATH = process.env.YOTI_PEM_KEY_PATH || '/opt/homeledger/yoti-sandbox.pem';
process.env.YOTI_SANDBOX = 'true';
process.env.YOTI_IDV_API_URL = process.env.YOTI_IDV_API_URL || 'https://api.yoti.com/sandbox/idverify/v1';

const { IDVClient, SessionSpecificationBuilder, RequestedDocumentAuthenticityCheckBuilder, RequestedLivenessCheckBuilder, RequestedFaceMatchCheckBuilder, RequestedTextExtractionTaskBuilder, SdkConfigBuilder } = require('yoti');
const fs = require('fs');

async function main() {
  const pem = fs.readFileSync('/opt/homeledger/yoti-sandbox.pem', 'utf-8');
  console.log('PEM loaded, length:', pem.length);

  const client = new IDVClient('fbd0172b-caf5-4fe5-bab6-4ce60c6731b2', pem);
  console.log('IDVClient created');

  try {
    const sdkConfig = new SdkConfigBuilder()
      .withAllowsCameraAndUpload()
      .withPrimaryColour('#1e40af')
      .withLocale('en')
      .withPresetIssuingCountry('GBR')
      .withSuccessUrl('https://homeledger.co.uk/verify-identity?status=success')
      .withErrorUrl('https://homeledger.co.uk/verify-identity?status=error')
      .build();

    const sessionSpec = new SessionSpecificationBuilder()
      .withClientSessionTokenTtl(600)
      .withResourcesTtl(604800)
      .withRequestedCheck(new RequestedDocumentAuthenticityCheckBuilder().withManualCheckFallback().build())
      .withRequestedCheck(new RequestedFaceMatchCheckBuilder().withManualCheckFallback().build())
      .withRequestedCheck(new RequestedLivenessCheckBuilder().forZoomLiveness().withMaxRetries(3).build())
      .withRequestedTask(new RequestedTextExtractionTaskBuilder().withManualCheckFallback().build())
      .withSdkConfig(sdkConfig)
      .build();

    console.log('Session spec built, creating session...');
    const session = await client.createSession(sessionSpec);
    console.log('SESSION CREATED!');
    console.log('Session ID:', session.getSessionId());
    console.log('Client Token:', session.getClientSessionToken());
    console.log('TTL:', session.getClientSessionTokenTtl());
  } catch (error) {
    console.error('FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.statusCode);
      console.error('Response body:', error.response.body);
    }
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

main();
