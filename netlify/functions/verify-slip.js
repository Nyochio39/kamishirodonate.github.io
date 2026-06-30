exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { imageBase64, mimeType, apiKey } = JSON.parse(event.body || '{}');

    if (!imageBase64 || !apiKey) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ success: false, message: 'Missing imageBase64 or apiKey' })
      };
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const mime = mimeType || 'image/jpeg';
    const ext  = mime.includes('png') ? 'png' : 'jpg';

    const FormData = require('form-data');
    const fetch    = require('node-fetch');

    const form = new FormData();
    form.append('files', imageBuffer, { filename: 'slip.' + ext, contentType: mime });

    const response = await fetch(
      'https://api.slipok.com/api/line/apikey/' + apiKey.trim(),
      { method: 'POST', body: form, headers: form.getHeaders() }
    );

    const data = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('verify-slip error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Server error: ' + err.message })
    };
  }
};
