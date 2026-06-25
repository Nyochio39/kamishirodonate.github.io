// Netlify Function: verify-slip.js
// รับ slip image จาก browser แล้วส่งต่อไป SlipOK API (bypass CORS)

exports.handler = async (event) => {
  // CORS headers — อนุญาต kamishirodonate.netlify.app
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // รับ base64 image และ apiKey จาก body
    const { imageBase64, mimeType, apiKey } = JSON.parse(event.body || '{}');

    if (!imageBase64 || !apiKey) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ success: false, message: 'Missing imageBase64 or apiKey' })
      };
    }

    // แปลง base64 กลับเป็น binary
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const mime = mimeType || 'image/jpeg';
    const ext  = mime.includes('png') ? 'png' : 'jpg';

    // ส่งไป SlipOK
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
