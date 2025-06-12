const https = require('https');
const querystring = require('querystring');

const apiKey = 'TXdBWXdPQWNMMjdpcHRGblIyaVg6MTpjaQ';
const apiSecret = 'nsN3ICJpwMHpfxYCAP6EG5hC4Q9jmaOGgiKq3v1XB8LTAm2-xJ';
const credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

const postData = querystring.stringify({
  'grant_type': 'client_credentials'
});

const options = {
  hostname: 'api.twitter.com',
  port: 443,
  path: '/oauth2/token',
  method: 'POST',
  headers: {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.access_token) {
        console.log('SUCCESS: New Bearer Token Generated');
        console.log('TWITTER_BEARER_TOKEN=' + response.access_token);
      } else {
        console.log('ERROR: No access token in response');
        console.log(data);
      }
    } catch (error) {
      console.log('ERROR: Failed to parse response');
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('ERROR:', error);
});

req.write(postData);
req.end();
